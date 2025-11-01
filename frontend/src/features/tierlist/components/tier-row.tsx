import escapeHTML from 'escape-html';
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react';
import ContentEditable from 'react-contenteditable';

import ItemThumb from '@/features/tierlist/components/item-thumb';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import { useUpdateTier } from '@/features/tierlist/hooks/use-update-tier';
import type { Tier, TieredItem } from '@/features/tierlist/types/tier-list';
import { getTierColor } from '@/features/tierlist/utils/get-tier-color';
import { useStaticToast } from '@/hooks/use-static-toast';

export interface TierListRowProps {
  tier: Tier;
  items: TieredItem[];
  setDetailedItemId: Dispatch<SetStateAction<string | undefined>>;
}

export default function TierRow({
  tier,
  items,
  setDetailedItemId,
}: TierListRowProps) {
  return (
    <div className="flex flex-row border-gray-950">
      <TierName tier={tier} />
      <div className="bg-surface flex flex-1 flex-row flex-wrap">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setDetailedItemId(item.id)}
          >
            <ItemThumb item={item} />
          </button>
        ))}
      </div>
    </div>
  );
}

interface TierNameProps {
  tier: Tier;
}

function TierName({ tier }: TierNameProps) {
  const { htmlText, setHtmlText, canOverwrite } = useDeferredText(tier.name);
  const contentRef = useRef<HTMLDivElement>(undefined!);

  const { tierList } = useTierList();
  const { mutate } = useUpdateTier();

  const { setToast, clearToast } = useStaticToast('error');

  const onBlurRef = useClosureRef(() => {
    canOverwrite.current = true;

    const newName = contentRef.current.textContent ?? '';
    if (newName === tier.name) return;
    if (
      newName !== '' &&
      !tierList?.tiers.find((t) => t.name === newName && t.id !== tier.id)
    ) {
      mutate({ id: tier.id, data: { name: newName } });
    } else {
      setHtmlText(tier.name);
    }

    clearToast();
  }, [tier.name, tierList, tier.id, mutate]);

  return (
    <ContentEditable
      html={htmlText}
      innerRef={contentRef}
      onChange={() => {
        let newName = contentRef.current.textContent ?? '';
        if (newName.length > 255) {
          newName = newName.substring(0, 255);
        }

        setHtmlText(newName);

        if (newName === '') {
          setToast('Tier name cannot be empty');
        } else if (
          tierList?.tiers.find((t) => t.name === newName && t.id !== tier.id)
        ) {
          setToast('Tier name already in use');
        } else {
          clearToast();
        }
      }}
      onFocus={() => (canOverwrite.current = false)}
      onBlur={() => onBlurRef.current()}
      style={{
        backgroundColor: getTierColor(tier.idx),
        caretColor: htmlText ? 'auto' : 'transparent',
      }}
      className="text-surface flex min-h-24 w-24 items-center justify-center border-r-1 border-gray-950 text-center font-semibold wrap-anywhere"
    />
  );
}

function useDeferredText(value: string) {
  const forceUpdate = useReducer((x) => x + 1, 0)[1];

  const htmlText = useRef(escapeHTML(value));
  const setHtmlText = useCallback(
    (value: string) => {
      htmlText.current = escapeHTML(value);
      forceUpdate();
    },
    [forceUpdate]
  );

  const canOverwrite = useRef(true);

  useEffect(
    function refreshOnNewValue() {
      if (!canOverwrite.current) return;

      htmlText.current = escapeHTML(value);
      forceUpdate();
    },
    [value, forceUpdate]
  );

  return { htmlText: htmlText.current, setHtmlText, canOverwrite };
}

// Workaround for stale closure side-effect of ContentEditable's shouldComponentUpdate
// https://github.com/lovasoa/react-contenteditable/issues/161#issuecomment-713052366
function useClosureRef(fn: () => void, deps: DependencyList) {
  const ref = useRef(fn);

  useEffect(() => {
    ref.current = fn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

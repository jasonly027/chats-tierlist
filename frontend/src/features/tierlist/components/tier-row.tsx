import escapeHTML from 'escape-html';
import {
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import ContentEditable from 'react-contenteditable';
import toast from 'react-hot-toast';

import Item from '@/features/tierlist/components/item';
import { useTierList } from '@/features/tierlist/hooks/use-tier-list';
import type { Tier, TieredItem } from '@/features/tierlist/types/tier-list';

export interface TierListRowProps {
  tier: Tier;
  setDetailedItem: Dispatch<SetStateAction<TieredItem | undefined>>;
}

export default function TierRow({ tier, setDetailedItem }: TierListRowProps) {
  return (
    <div className="flex flex-row bg-gray-900">
      <TierName tier={tier} />
      <div className="flex flex-row flex-wrap">
        {tier.items.map((item) => (
          <div key={item.name} onClick={() => setDetailedItem(item)}>
            <Item item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TierNameProps {
  tier: Tier;
}

function TierName({ tier }: TierNameProps) {
  const [text, setText] = useReducer(escapeReducer, tier.name, escapeHTML);
  useEffect(
    function refreshOnNewName() {
      setText(tier.name);
    },
    [tier.name]
  );

  const { updateTier } = useTierList();

  const toastErrorId = useRef<string>(null);
  const clearToast = () => {
    if (toastErrorId.current) {
      toast.dismiss(toastErrorId.current);
      toastErrorId.current = null;
    }
  };

  // Workaround for stale closure side-effect of ContentEditable's shouldComponentUpdate
  // https://github.com/lovasoa/react-contenteditable/issues/161#issuecomment-713052366
  const onBlurRef = useRef(() => {
    setText(tier.name);
    clearToast();
  });
  useEffect(() => {
    onBlurRef.current = () => {
      setText(tier.name);
      clearToast();
    };
  }, [tier.name]);

  const contentRef = useRef<HTMLElement>(undefined!);

  return (
    <ContentEditable
      html={text}
      innerRef={contentRef}
      onChange={() => {
        const newName = contentRef.current.textContent;
        if (newName === tier.name) return;

        setText(newName);
        const success = updateTier(tier.name, { name: newName });
        if (!success) {
          if (!toastErrorId.current) {
            toastErrorId.current = toast.error(
              `New tier name for ${tier.name} is empty or already in use`,
              {
                duration: Infinity,
              }
            );
          }
        } else {
          clearToast();
        }
      }}
      onBlur={() => onBlurRef.current()}
      style={{
        backgroundColor: tier.color,
        caretColor: text ? 'auto' : 'transparent',
      }}
      className="flex min-h-24 w-24 items-center justify-center text-center font-bold wrap-anywhere"
    />
  );
}

function escapeReducer(_prev: string, next: string) {
  return escapeHTML(next);
}

import { produce } from 'immer';

const obj = { inner: 'helo' };

let outer = { a: obj, b: obj };
console.log(outer);
outer.a.inner = 'sid';
console.log(outer);
outer = produce(outer, (draft) => {
  draft.a.inner = 'belo';
});
console.log(outer);
console.log(obj);

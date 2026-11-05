export function newId() {
  return "g" + Math.random().toString(36).slice(2, 9);
}

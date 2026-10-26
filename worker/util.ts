type WithID = { id: string };
type WithNullID<T> = {
  [K in keyof T]: K extends 'id' ? T[K] | null : T[K];
};

export const makeArrayDiff = <T extends WithID>(before: T[], after: WithNullID<T>[]) => {
  const created = after.filter((item) => item.id === null);
  const withId = after.filter((item) => item.id !== null) as T[];
  const afterIdDict = new Map(withId.map((item) => [item.id, item] as const));
  const deleted: string[] = [];
  const updated: T[] = [];
  before.forEach((b) => {
    const item = afterIdDict.get(b.id);
    if (item) {
      updated.push(item);
    } else {
      deleted.push(b.id);
    }
  });

  return { created, updated, deleted };
};

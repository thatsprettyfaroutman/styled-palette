export const getDeepKeys = (item?: Record<string, unknown>) => {
  const crawl = (_item: typeof item) => {
    const keys: string[] = []

    if (!_item) {
      return keys
    }

    for (const key in _item) {
      keys.push(key)
      const item = _item[key] as typeof _item
      if (typeof item === 'object') {
        const subKeys = crawl(item)
        keys.push(
          ...subKeys.map((subKey) => {
            return key + '.' + subKey
          })
        )
      }
    }
    return keys
  }

  return crawl(item).join(',')
}

export function binarySearch<T>(xs: T[], compare: (t: T) => number): number {
  let index = -1
  let min = 0
  let max = xs.length - 1

  LOOP: while (min <= max) {
    const mid = Math.floor((min + max) / 2)
    const result = compare(xs[mid])
    switch (result) {
      case 0:
        index = mid
        break LOOP
      case -1:
        min = mid + 1
        break
      case 1:
        max = mid - 1
        break
    }
  }
  return index
}

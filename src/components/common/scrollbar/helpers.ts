import { get, defaultsDeep, debounce, isNaN, isArray, isEmpty } from "lodash-es"

/**
 * @param {Number} value
 * @param {Number} defValue
 */
export function checkNumber(value = 0, defValue = 0) {
  value = +value
  return isNaN(value) ? defValue : value
}

/**
 * @param {Number} limitY
 * @param {Number} offsetY
 * @param {Number} loadThreshold
 */
export function checkLoadCapability(
  limitY = 0,
  offsetY = 0,
  loadThreshold = 0
) {
  limitY = checkNumber(limitY)
  offsetY = checkNumber(offsetY)
  loadThreshold = checkNumber(loadThreshold)

  return offsetY >= limitY - loadThreshold
}

/**
 *
 * @param scrollBar
 * @param axis
 * @param prop
 * @return {*}
 */
export function getScrollState(scrollBar: any, axis = "", prop = "") {
  let state = get(scrollBar, prop, {})

  switch (axis) {
    case "x":
    case "y":
      return get(state, axis)

    default:
      return state
  }
}

export default {
  checkNumber,
  checkLoadCapability,
  debounce,
  defaultsDeep,
  get,
  getScrollState,
  isArray,
  isEmpty,
  isNaN,
}

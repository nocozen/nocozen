/**
 * This files contains the primitives required to create drag images from HTML elements that serve as models. A snapshot
 * of the computed styles of the model elements is taken when creating the drag image, so that it will look the same as
 * the model, no matter where the drag images is grafted into the DOM.
 */

/**
 * Creates a drag image using the given element as model.
 */
export function createDragImage (el: any) {
  const clone = deepClone(el);
  clone.style.position = 'fixed';
  clone.style.margin = '0';
  clone.style['z-index'] = '9000';
  clone.style.transition = 'opacity 0.2s';
  return clone;
}

/**
 * Clones the given element and all its descendants.
 */
function deepClone (el: any) {
  const clone = el.cloneNode(true);
  copyStyle(el, clone);
  const vSrcElements = el.getElementsByTagName('*');
  const vDstElements = clone.getElementsByTagName('*');
  for (let i = vSrcElements.length; i--;) {
    const vSrcElement = vSrcElements[i];
    const vDstElement = vDstElements[i];
    copyStyle(vSrcElement, vDstElement);
  }
  return clone;
}

/**
 * Copy the computed styles from src to destination.
 */
function copyStyle (src: any, destination: any) {
  const computedStyle = window.getComputedStyle(src);
  for (const key of Object.keys(computedStyle)) {
    if (key === 'width') {
      // IE11
      const width = computedStyle.getPropertyValue('box-sizing') === 'border-box' ?
        src.clientWidth :
        src.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
      destination.style.setProperty('width', width + 'px');
    }
    else if (key === 'height') {
      // IE11
      const height = computedStyle.getPropertyValue('box-sizing') === 'border-box' ?
        src.clientHeight :
        src.clientHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom);
      destination.style.setProperty('height', height + 'px');
    }
    else {
      destination.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key));
    }
  }
  destination.style.pointerEvents = 'none';
}

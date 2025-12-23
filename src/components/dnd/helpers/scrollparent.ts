// Forked from https://gist.github.com/gre/296291b8ce0d8fe6e1c3ea4f1d1c5c3b
const regex = /(auto|scroll)/;

const style = (node: any, prop: string) =>
  getComputedStyle(node, null).getPropertyValue(prop);

const scroll = (node: any) =>
  regex.test(
    style(node, 'overflow') +
    style(node, 'overflow-y') +
    style(node, 'overflow-x'));

const scrollparent = (node: any): any =>
  !node || node===document.body
    ? document.body
    : scroll(node)
      ? node
      : scrollparent(node.parentNode);

export default scrollparent;

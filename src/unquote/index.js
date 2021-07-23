// copied from https://github.com/lakenen/node-unquote

var reg = /['"]/;

export default function unquote(str) {
  if (!str) {
    return "";
  }
  if (reg.test(str.charAt(0))) {
    str = str.substr(1);
  }
  if (reg.test(str.charAt(str.length - 1))) {
    str = str.substr(0, str.length - 1);
  }
  return str;
}

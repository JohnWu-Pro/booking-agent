(async (window) => {
console.debug('Running court-reserve.js');

function $A(cssSelector, container) {
  return (container ?? document).querySelectorAll(cssSelector);
}

function $E(cssSelector, container) {
  return (container ?? document).querySelector(cssSelector);
}

function create(tag, attributes) {
  const element = document.createElement(tag);
  for(let name in attributes) {
    element[name] = attributes[name];
  }
  return element;
}

function append(tag, attributes, container) {
  return (container ?? document.body).appendChild(create(tag, attributes));
}

function prepend(tag, attributes, container) {
  const element = create(tag, attributes);
  (container ?? document.body).prepend(element);
  return element;
}

prepend('div', {className: "bookalet"}).innerHTML = /*html*/`
  <span>Bookalet</span>
`;

})(window);

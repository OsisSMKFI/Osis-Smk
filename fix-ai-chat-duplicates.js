module.exports = function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  /* ===============================
     FIX DUPLICATE userQuery
  =============================== */
  let userQueryFound = false;

  root.find(j.VariableDeclarator, { id: { name: 'userQuery' } })
    .forEach(path => {
      if (userQueryFound) {
        j(path.parent).remove();
      } else {
        userQueryFound = true;
      }
    });

  /* ===============================
     FIX DUPLICATE body
  =============================== */
  let bodyFound = false;

  root.find(j.VariableDeclarator, { id: { name: 'body' } })
    .forEach(path => {
      if (bodyFound) {
        j(path.parent).remove();
      } else {
        bodyFound = true;
      }
    });

  /* ===============================
     FIX implicit any (w)
  =============================== */
  root.find(j.ArrowFunctionExpression)
    .forEach(path => {
      const param = path.node.params[0];
      if (
        param &&
        param.type === 'Identifier' &&
        param.name === 'w' &&
        !param.typeAnnotation
      ) {
        param.typeAnnotation = j.tsTypeAnnotation(
          j.tsStringKeyword()
        );
      }
    });

  return root.toSource({ quote: 'single' });
};

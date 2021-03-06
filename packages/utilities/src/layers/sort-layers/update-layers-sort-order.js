export function updateLayersSortOrder (layers) {
  const copy = layers.slice()
  const insertIndex = calculateInsertIndex(copy)
  const parentLayer = copy[0].parent // we've already checked that `layers` have a common parent
  if (parentLayer.type !== 'DOCUMENT') {
    copy.reverse()
  }
  const before = collectLayerIndices(copy)
  copy.forEach(function (layer) {
    parentLayer.insertChild(insertIndex, layer)
  })
  const after = collectLayerIndices(copy)
  return areArraysIdentical(before, after) === false
}

function calculateInsertIndex (layers) {
  const childLayerIds = layers[0].parent.children.map(function (layer) {
    return layer.id
  })
  let insertIndex = -1
  layers.forEach(function (layer) {
    const index = childLayerIds.indexOf(layer.id)
    if (index > insertIndex) {
      insertIndex = index
    }
  })
  return insertIndex + 1
}

function collectLayerIndices (layers) {
  const result = []
  const children = layers[0].parent.children
  for (const layer of layers) {
    result.push(children.indexOf(layer))
  }
  return result
}

function areArraysIdentical (a, b) {
  if (a.length !== b.length) {
    return false
  }
  for (const index in a) {
    if (a[index] !== b[index]) {
      return false
    }
  }
  return true
}

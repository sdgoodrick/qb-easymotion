function getVisibleElements(filter) {
    var all = Array.from(document.documentElement.getElementsByTagName("*"));
    var visibleElements = [];
    all.forEach(el => {
	// add and process any elements in a shadow root
	if (el.shadowRoot) {
	    let shadows = el.shadowRoot.querySelector('*');
	    shadows.forEach(shadow => all.push(shadow));
	}

	let rect = el.getBoundingClientRect();
	if ((rect.top <= window.innerHeight)  && (rect.bottom >=0)
            && (rect.left <= window.innerWidth) && (rect.right >= 0)
            && (rect.height > 0)
            && (window.getComputedStyle(el).visibility !== 'hidden')) {
	    filter(el, visibleElements);
	}
    });

    return visibleElements;
}

// get the position of a text node
// TODO: make this return an array like the other function
function getTextNodePosition(node, offset) {
    let selection = document.getSelection();
    selection.setBaseAndExtent(node, offset, node, node.data.length);
    let bound = selection.getRangeAt(0).getClientRects()[0];

    let position = {
	left:   -1,
	top:    -1,
	width:  0,
	height: 0
    };

    if (bound && bound.height > 0 && bound.width > 0) {
	position.left   = bound.left;
	position.top    = bound.top;
	position.width  = bound.width;
	position.height = bound.height;
    }

    return position;
}

// get the positions of individual units within text nodes
function getWordPositions(node, unit = "word") {
    let selection = document.getSelection();
    selection.setPosition(node, 0);

    let positions = [];
    let selStart = 0;

    do {
	selection.modify("move", "forward", unit);
	let selOffset = selection.anchorOffset;
	selection.setBaseAndExtent(node, selStart, node, selOffset);

	let bound = selection.getRangeAt(0).getClientRects()[0];
	if (bound && bound.height > 0 && bound.width > 0) {
	    let position = {
		left:   bound.left,
		top:    bound.top,
		width:  bound.width,
		height: bound.height,
	    };

	    positions.push(position);
	}

	selStart = selOffset;
	selection.setPosition(node, selStart);
    } while (selStart < node.data.length);

    return positions;
}

(function createTextHints() {
    let oldSelection = document.getSelection();

    // filter out visible text elements
    let elements = getVisibleElements((el, vec) => {
	let children = Array.from(el.childNodes);
	// keep this element if and only if it contains a non-empty text node
	if (children.find(child =>
	    child.nodeType == Node.TEXT_NODE && child.data.length > 0))
	    vec.push(el);
    });

    // cut out any empty elements
    elements = elements.flatMap(el => {
	let children = el.childNodes;
	let result = [];

	children.forEach(child => {
	    if (child.nodeType == Node.TEXT_NODE
		&& child.data.trim().length > 1) {
		result.push(child);
	    }
	});

	return result;
    });

    elements.forEach(el => {
	let positions = getWordPositions(el);
    });
})();

define(function() {
    return function(dom, cb) {
        var nop = function(e) { e.preventDefault() },
            ondragenter = function(e) { dom.classList.toggle('hover'); nop(e) },
            ondragleave = function(e) { dom.classList.toggle('hover'); nop(e) },
            ondrop = function(e) { dom.classList.toggle('hover'); droppaste(e.dataTransfer); nop(e) },
            onpaste = function(e) { droppaste(e.clipboardData); nop(e) },
            droppaste = function(data) {
                if (data.files.length > 0) {
                    cb({file: data.files[0]});
                } else {
                    var type, uri;

                    if (data.types.indexOf(type = 'text/uri-list') !== -1) {
                        cb({
                            uri: data.getData(type).split('\n')[0]
                        });
                    } else if (data.types.indexOf(type = 'text/plain') !== -1) {
                        cb({
                            type: type,
                            rawdata: data.getData(type)
                        });
                    }
                }
            };

        dom.addEventListener('dragover', nop);
        dom.addEventListener('dragenter', ondragenter);
        dom.addEventListener('dragleave', ondragleave);
        dom.addEventListener('drop', ondrop);
        dom.addEventListener('paste', onpaste);
    }
});

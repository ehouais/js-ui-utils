define(['ui-utils'], function($) {
    return function($dom, params, cb) {
        var data = {},
            $fields = $.element('div'),
            $buttons = $.element('div'),
            $submit,
            id;

        for (id in params.fields) {
            $field = $.element('input', {type: 'text', placeholder: params.fields[id]});
            $field.dataset.id = id;
            $fields.appendChild($field);
        }

        for (id in params.buttons) {
            $button = $.element('button');
            $button.dataset.id = id.substr(1, id.length-2);
            $button.textContent = params.buttons[id];
            $buttons.appendChild($button);
        }

        $submit = $.element('button');
        $submit.textContent = 'Submit';
        $buttons.appendChild($submit);
        $submit.addEventListener('click', function(e) {
            cb($.selectAll('input', $fields).reduce(function(data, $node) {
                data[$node.dataset.id] = $node.value;
                return data;
            }, {}));
        });

        $dom.appendChild($fields);
        $dom.appendChild($buttons);

        return function(data) {
            $.selectAll('input', $fields).forEach(function($node) {
                var value = data[$node.dataset.id];
                $node.value = typeof value == 'undefined' ? '' : value;
            });
        };
    };
});

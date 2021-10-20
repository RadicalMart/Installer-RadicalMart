window.HikasuUtils = {
    createElement: function(tag, attr, innerHtml) {
        let self = this;
        let element = document.createElement(tag);

        for(let keyAttr in attr) {
            if(keyAttr === 'events') {
                let eventsLength = attr[keyAttr].length;
                for(let i=0;i<eventsLength;i++) {
                    element.addEventListener(attr[keyAttr][i][0], attr[keyAttr][i][1]);
                }
                continue;
            }

            element.setAttribute(keyAttr, attr[keyAttr]);
        }

        if(innerHtml !== undefined && innerHtml !== null) {

            if(typeof innerHtml === 'function') {
                element.innerHTML = innerHtml();
            }

            if(typeof innerHtml === 'string') {
                element.innerHTML = innerHtml;
            }

            if(typeof innerHtml === 'object') {
                element.append(innerHtml);
            }

        }

        return {
            el: element,
            parent: undefined,
            child: [],
            getParent: function() {
                return this.parent;
            },
            setParent: function(parent) {
                this.parent = parent;
                return this;
            },
            add: function (tag, attr, innerHtml) {
                this.child.push(self.createElement(tag, attr, innerHtml).setParent(this));
                return this;
            },
            addChild: function (tag, attr, innerHtml) {
                this.child.push(self.createElement(tag, attr, innerHtml).setParent(this));
                return this.child[ this.child.length - 1];
            },
            build: function () {
                let buildElement = this.el;

                if(this.child.length > 0) {

                    for(let i=0;i<this.child.length;i++) {
                        buildElement.appendChild(this.child[i].build());
                    }

                    return buildElement;
                } else {
                    return buildElement;
                }

            },
        }
    },

    generateColorFromText: function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    },

    modal: function(header, body, footer, classForModal) {
        if(classForModal === null) {
            classForModal = '';
        }

        let modalBackground = document.querySelector('.hikasu-modal_background');
        let activeModal = document.querySelector('.hikasu-modal');
        if(activeModal !== null) {
            activeModal.remove();
            modalBackground.classList.remove('active');
        }


        let modal = this.createElement('div', {'class': 'hikasu-modal ' + classForModal})
            .addChild('div', {'class': 'hikasu-modal_container'})
                .add('button', {
                    'class': 'btn btn-danger btn-large hikasu-modal_close',
                    'events': [
                        ['click', function (ev) {
                            let modalBackground = document.querySelector('.hikasu-modal_background');

                            modalBackground.classList.remove('active');
                            this.closest('.hikasu-modal').remove();
                        }]
                    ]}, '<span class="icon-delete large-icon"></span> ' + HikasuLangs.button_close)
                .add('div', {'class': 'hikasu-modal_header'}, header)
                    .addChild('div', {'class': 'hikasu-modal_body-wrap'})
                        .add('div', {'class': 'hikasu-modal_body'}, body)
                        .getParent()
                .getParent();


        if(modalBackground === null) {
            modalBackground = this.createElement('div', {'class': 'hikasu-modal_background'}).build();
            document.querySelector('body').append(modalBackground);
        }

        modalBackground.classList.add('active');
        document.querySelector('body').append(modal.build());

    },

    modalAjax: function(header, url) {
        let modalBackground = document.querySelector('.hikasu-modal_background');
        let activeModal = document.querySelector('.hikasu-modal');
        if(activeModal !== null) {
            activeModal.remove();
            modalBackground.classList.remove('active');
        }


        let modal = this.createElement('div', {'class': 'hikasu-modal hikasu-modal-iframe'})
            .addChild('div', {'class': 'hikasu-modal_container'})
                .add('button', {
                    'class': 'btn btn-danger btn-large hikasu-modal_close',
                    'events': [
                        ['click', function (ev) {
                            let modalBackground = document.querySelector('.hikasu-modal_background');

                            modalBackground.classList.remove('active');
                            this.closest('.hikasu-modal').remove();
                        }]
                    ]}, '<span class="icon-delete large-icon"></span> ' + HikasuLangs.button_close)
                .add('div', {'class': 'hikasu-modal_header'}, header)
                .add('iframe', {'class': 'hikasu-modal_iframe', 'src': url})
            .getParent();


        if(modalBackground === null) {
            modalBackground = this.createElement('div', {'class': 'hikasu-modal_background'}).build();
            document.querySelector('body').append(modalBackground);
        }

        modalBackground.classList.add('active');
        document.querySelector('body').append(modal.build());
    },

    modalClose: function () {

        let modalBackground = document.querySelector('.hikasu-modal_background');
        let activeModal = document.querySelector('.hikasu-modal');
        if(activeModal !== null) {
            activeModal.remove();
            modalBackground.classList.remove('active');
        }

    }

};
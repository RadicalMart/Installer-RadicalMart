window.RadicalInstallerUtils = {
    ajaxGet: function (url, data) {
        let self = this,
            request = new XMLHttpRequest();

        if (data !== undefined && data !== null) {
            url += '&' + Object.keys(data).map(function (key) {
                return key + '=' + data[key];
            }).join('&');
        }

        request.open('GET', url);
        return self.ajaxRequest(request);
    },


    ajaxPost: function (url, data) {
        let self = this,
            request = new XMLHttpRequest(),
            formData = new FormData();

        if (data !== undefined && data !== null) {
            for (let key in data) {
                formData.append(key, data[key]);
            }
        }


        request.open('POST', url);
        let ajax = self.ajaxRequest(request, false);
        request.send(formData);

        return ajax
    },


    ajaxRequest: function (request, send = true) {
        let ajax = new function () {
            return this;
        };
        ajax.request = request;
        ajax.request.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    if (ajax.done !== undefined) {
                        let response = JSON.parse(this.responseText);

                        if(response === null || response === undefined)
                        {
                            response = this.responseText;
                        }

                        ajax.done(response, this);
                    }
                } else {
                    if (ajax.fail !== undefined) {
                        ajax.fail(this);
                    }
                }

            }
        };

        if (send) {
            ajax.request.send();
        }

        let ajax_proxy = new Proxy(ajax, {
            get: function (target_original, prop, receiver) {
                let F = function (...args) {
                }
                return new Proxy(F, {
                    apply: function (target, thisArg, argumentsList) {
                        target_original[prop] = argumentsList[0];
                        return ajax_proxy;
                    }
                });
            },
            set(target, prop, val) {
                target[prop] = val;
                return true;
            }
        });

        return ajax_proxy;
    },


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

                if(innerHtml.length > 1) {
                    for(let c in innerHtml) {
                        element.append(innerHtml[c]);
                    }
                } else {
                    element.append(innerHtml);
                }
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
        let hash = 0;
        let colour = '#';

        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    },


    modal: function(header, body, footer, classForModal, callback_close) {
        if(classForModal === null) {
            classForModal = '';
        }

        let modalBackground = document.querySelector('.radicalinstaller-modal_background');
        let activeModal = document.querySelector('.radicalinstaller-modal');
        if(activeModal !== null) {
            activeModal.remove();
            modalBackground.classList.remove('active');
        }


        let modal = this.createElement('div', {'class': 'radicalinstaller-modal ' + classForModal})
            .addChild('div', {'class': 'radicalinstaller-modal_container'})
                .add('button', {
                    'class': 'btn btn-danger radicalinstaller-modal_close',
                    'events': [
                        ['click', function (ev) {
                            let modalBackground = document.querySelector('.radicalinstaller-modal_background');

                            modalBackground.classList.remove('active');
                            this.closest('.radicalinstaller-modal').remove();

                            if(callback_close !== undefined && callback_close !== null) {
                                callback_close();
                            }
                        }]
                    ]}, '<span class="icon-delete large-icon"></span> ' + RadicalInstallerLangs.button_close)
                .add('div', {'class': 'radicalinstaller-modal_header'}, header)
                    .addChild('div', {'class': 'radicalinstaller-modal_body-wrap'})
                        .add('div', {'class': 'radicalinstaller-modal_body'}, body)
                        .getParent()
                .getParent();


        if(modalBackground === null) {
            modalBackground = this.createElement('div', {'class': 'radicalinstaller-modal_background'}).build();
            document.querySelector('body').append(modalBackground);
        }

        modalBackground.classList.add('active');
        document.querySelector('body').append(modal.build());

    },


    modalAjax: function(header, url) {
        let modalBackground = document.querySelector('.radicalinstaller-modal_background');
        let activeModal = document.querySelector('.radicalinstaller-modal');
        if(activeModal !== null) {
            activeModal.remove();
            modalBackground.classList.remove('active');
        }


        let modal = this.createElement('div', {'class': 'radicalinstaller-modal radicalinstaller-modal-iframe'})
            .addChild('div', {'class': 'radicalinstaller-modal_container'})
                .add('button', {
                    'class': 'btn btn-danger btn-large radicalinstaller-modal_close',
                    'events': [
                        ['click', function (ev) {
                            let modalBackground = document.querySelector('.radicalinstaller-modal_background');

                            modalBackground.classList.remove('active');
                            this.closest('.radicalinstaller-modal').remove();
                        }]
                    ]}, '<span class="icon-delete large-icon"></span> ' + RadicalInstallerLangs.button_close)
                .add('div', {'class': 'radicalinstaller-modal_header'}, header)
                .add('iframe', {'class': 'radicalinstaller-modal_iframe', 'src': url})
            .getParent();


        if(modalBackground === null) {
            modalBackground = this.createElement('div', {'class': 'radicalinstaller-modal_background'}).build();
            document.querySelector('body').append(modalBackground);
        }

        modalBackground.classList.add('active');
        document.querySelector('body').append(modal.build());
    },


    modalClose: function () {

        let modalBackground = document.querySelector('.radicalinstaller-modal_background');
        let activeModal = document.querySelector('.radicalinstaller-modal');
        if(activeModal !== null) {
            activeModal.remove();
            modalBackground.classList.remove('active');
        }

    },


    /**
     * Source: https://github.com/lalaman/lala-alerts-js
     *
     * @param message
     * @param status
     * @param timeout
     */
    createAlert: function(message, status, timeout) {

        //Used to determine whether to remove setTimeout or not
        let timeout_check;

        //Create alert element
        let alert = document.createElement("div");
        alert.className += "animation-target radicalinstaller-alert ";

        //Attach correct colour to alert
        let status_class = "radicalinstaller-alert-" + status + " ";
        alert.className += status_class;

        //Create close button
        let close_button = document.createElement("span");
        close_button.className += " close-alert-x glyphicon glyphicon-remove";

        /*
            There are 3 event listeners:
                1. Clicking x to close alert
                2. Mousing over to prevent timeout
                3. Mousing out to start timeout
        */
        close_button.addEventListener("click", function () {
            let parent = this.parentNode;
            parent.parentNode.removeChild(parent);
        });

        alert.addEventListener("mouseover", function () {
            this.classList.remove("fade-out");
            clearTimeout(timeout_check);
        });

        alert.addEventListener("mouseout", function () {
            timeout_check = setTimeout(function () {
                alert.className += " fade-out";
                if (alert.parentNode) {
                    timeout_check = setTimeout(function () {
                        alert.parentNode.removeChild(alert)
                    }, 500);
                }
            }, 3000);
        });

        //Add message and close button
        alert.innerHTML = message;
        alert.appendChild(close_button);

        //Prepend new alert to container
        let alert_wrapper = document.getElementById("radicalinstaller-alert-wrapper");

        if (
            alert_wrapper === undefined ||
            alert_wrapper === null) {
            let alert_container = document.createElement('div');
            alert_container.setAttribute('id', 'radicalinstaller-alert-container');
            alert_wrapper = document.createElement('div');
            alert_wrapper.setAttribute('id', 'radicalinstaller-alert-wrapper');
            alert_container.appendChild(alert_wrapper);
            document.querySelector('body').appendChild(alert_container);
        }

        alert_wrapper.insertBefore(alert, alert_wrapper.children[0]);

        //If they haven't clicked close within the timeout period, fade out and remove element
        timeout_check = setTimeout(function () {
            let parent = alert;
            parent.className += " fade-out";
            if (parent.parentNode) {
                timeout_check = setTimeout(function () {
                    parent.parentNode.removeChild(parent)
                }, 500);
            }
        }, timeout);
    },


    openInNewTab: function (url) {
        let win = window.open(url, '_blank');
        win.focus();
    }

};
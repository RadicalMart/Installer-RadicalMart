window.SovmartUtils = {

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
                        let response = this.responseText;

                        if(typeof response === 'string') {
                            response = JSON.parse(response);
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
                let F = function (...args) {};

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
            if(keyAttr === 'events' && attr[keyAttr] !== undefined) {

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
                    for(let c=0;c<innerHtml.length;c++) {
                        element.appendChild(innerHtml[c]);
                    }
                } else {
                    element.appendChild(innerHtml);
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

    randomInteger: function (min, max) {
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        rand = Math.round(rand);
        return rand;
    },

    modal: function (options) {

        if (options.container === undefined) {
            options.container = document.querySelector('body');
        }

        if (options.classForModal === undefined) {
            options.classForModal = '';
        }

        if (options.header === undefined) {
            options.header = '';
        }

        if (options.body === undefined) {
            options.body = '';
        }

        if (options.footer === undefined) {
            options.footer = '';
        }

        if (options.close === undefined) {
            options.close = true;
        }

        let modal = this.createElement('div', {'class': 'sovmart-modal-wrap ' + options.classForModal, 'events': [
                ['click', function (ev) {
                    if(ev.target.classList.contains('sovmart-modal-wrap')) {
                        document.querySelector('body').classList.remove('sovmart-modal-active');
                        this.remove();
                    }
                }]
            ]})
            .addChild('div', {'class': 'sovmart-container'});

        if (options.close) {
            modal = modal.add('button', {
                'class': 'ri-btn ri-btn-danger sovmart-close',
                'events': [
                    ['click', function (ev) {
                        this.closest('.sovmart-modal-wrap').remove();
                        document.querySelector('body').classList.remove('sovmart-modal-active');
                    }]
                ]
            }, SovmartLangs.close);
        }

        modal = modal.add('div', {'class': 'sovmart-header'}, options.header)
            .addChild('div', {'class': 'sovmart-body-wrap'})
            .add('div', {'class': 'sovmart-body'}, options.body)
            .getParent()
            .getParent();

        options.container.appendChild(modal.build());
        document.querySelector('body').classList.add('sovmart-modal-active');

        let modalClass = function (modal) {
            let self = this;
            self.modal = modal;
            self.modal_html = modal.build();

            this.show = function () {
                self.modal_html.classList.remove('sovmart-hide');
                document.querySelector('body').classList.add('sovmart-modal-active');
            }

            this.hide = function () {
                self.modal_html.classList.add('sovmart-hide');
            }

            this.destroy = function () {
                self.modal_html.remove();
            }

        }

        return (new modalClass(modal));
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
        alert.className += "animation-target sovmart-alert ";

        //Attach correct colour to alert
        let status_class = "sovmart-alert-" + status + " ";
        alert.className += status_class;

        //Create close button
        let close_button = document.createElement("span");
        close_button.className += " close-alert-x glyphicon glyphicon-remove";

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
        let alert_wrapper = document.getElementById("sovmart-alert-wrapper");

        if (
            alert_wrapper === undefined ||
            alert_wrapper === null) {
            let alert_container = document.createElement('div');
            alert_container.setAttribute('id', 'sovmart-alert-container');
            alert_wrapper = document.createElement('div');
            alert_wrapper.setAttribute('id', 'sovmart-alert-wrapper');
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
    },


    redirect: function (url) {
        window.location.href = url;
    }

};
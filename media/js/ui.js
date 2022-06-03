window.RadicalInstallerUI = {

    container: null,
    container_page: null,
    container_toolbar: null,
    container_form_key: null,
    container_loader: null,


    loaderShow: function (args) {
        let loader = RadicalInstallerUtils.createElement('div', {}, this.renderLoader()).build();
        args.container.append(loader);
        let promise = new Promise(args.wait);

        promise.then(
                result => {
                    loader.remove();
                },
                error => {
                    loader.remove();
                }
            );

        return promise;
    },


    showPage: function (args) {


        if(args.buttons !== undefined) {
            this.container_toolbar.innerHTML = '';
            this.container_toolbar.appendChild(this.renderToolbar(args.buttons));
        }

        if(args.page !== undefined) {

            this.container_page.innerHTML = '';

            if(args.page.length > 0) {
                for(let k in args.page) {
                    this.container_page.appendChild(args.page[k]);
                }

                return;
            }

            this.container_page.appendChild(args.page);
        }

    },


    renderToolbar: function (args) {
        let toolbar = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-toolbar radicalinstaller-flex radicalinstaller-child-margin-right-small'});

        if (args.groups !== undefined) {

            for(let k in args.groups) {
                toolbar.add('div', null, RadicalInstallerUI.renderToolbarGroup(args.groups[k]));
            }

            return toolbar.build();
        }

        toolbar.add('div', null, RadicalInstallerUI.renderToolbarGroup({name: 'default', items: args}));

        return toolbar.build();
    },


    renderToolbarGroup: function (buttons) {
        let group = RadicalInstallerUtils.createElement('div', {class: 'ri-btn-group'});

        for(let k in buttons.items) {

            if(
                buttons.items[k].dropdown !== undefined &&
                buttons.items[k].items !== undefined
            ) {
                group = group.addChild('div', {class: 'ri-btn-wrap'});
                group = group.add('button', {'type': 'button', 'events': buttons.items[k].dropdown.events, 'class': buttons.items[k].dropdown.class}, buttons.items[k].dropdown.label);
                group = group.addChild('div', {class: 'ri-btn-dropdown'});

                for(let i in buttons.items[k].items) {
                    let prop = {'type': 'button'};

                    if(buttons.items[k].items[i].events !== undefined) {
                        prop.events = buttons.items[k].items[i].events;
                    }

                    if(buttons.items[k].items[i].class !== undefined) {
                        prop.class = buttons.items[k].items[i].class;
                    }

                    if(buttons.items[k].items[i].disabled !== undefined) {
                        prop.disabled = buttons.items[k].items[i].disabled;
                    }

                    group = group.add('button', prop, buttons.items[k].items[i].label);
                }

                group = group.getParent();
                group = group.getParent();
            }
            else {
                let prop = {'type': 'button'};

                if(buttons.items[k].events !== undefined) {
                    prop.events = buttons.items[k].events;
                }

                if(buttons.items[k].class !== undefined) {
                    prop.class = buttons.items[k].class;
                }

                if(buttons.items[k].disabled !== undefined) {
                    prop.disabled = buttons.items[k].disabled;
                }

                group = group.add('button', prop, buttons.items[k].label);
            }

        }

        return group.build();
    },

    renderToolbarDropdown: function (buttons) {
        let dropdown = RadicalInstallerUtils.createElement('div', {class: 'ri-btn-dropdown'});

        for(let k in buttons) {
            dropdown = dropdown.add('button', {'type': 'button', 'events': buttons[k].events, 'class': buttons[k].class}, buttons[k].label);
        }

        dropdown = dropdown.getParent();

        return dropdown.build();
    },


    renderPage: function (args) {
        let page = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-page'});
        return page.build();
    },


    renderGroup: function (args) {
        let group = RadicalInstallerUtils
            .createElement('div', {class: 'radicalinstaller-group'});

        if(
            (args.label !== undefined && args.label !== '') ||
            args.buttons !== undefined
        ) {


            group = group.addChild('div', {class: 'radicalinstaller-group-header radicalinstaller-flex radicalinstaller-flex-middle'})
                .addChild('div', {class: 'radicalinstaller-width-auto radicalinstaller-margin-right'})
                    .add('h3', {}, args.label)
                    .getParent();

            if (args.buttons !== undefined) {
                group = group.addChild('div', {class: 'radicalinstaller-width-expand'});

                for (let k in args.buttons) {
                    group = group.add('button', {
                        'type': 'button',
                        'events': args.buttons[k].events,
                        class: args.buttons[k].class
                    }, args.buttons[k].label);
                }

                group = group.getParent();
            }

            group = group.getParent();
        }

        if (args.groups !== undefined) {

            for(let k in args.groups) {
                group = group.addChild('div', {class: 'radicalinstaller-group-subgroup ' + args.groups[k].class})
                    .add('h4', {}, args.groups[k].label)
                    .add('div', {}, args.groups[k].content)
                    .getParent();
            }

        }
        else
        {
            group = group.add('div', {class: 'radicalinstaller-group-content'}, args.content);
        }

        if (args.actions !== undefined) {
            group = group.addChild('div', {class: 'radicalinstaller-group-actions'});

            for (let k in args.actions) {
                group = group.add('button', {
                    'type': 'button',
                    'events': args.actions[k].events,
                    class: args.actions[k].class
                }, args.actions[k].label);
            }

            group = group.getParent();
        }

        return group.build();
    },


    renderFormKey: function () {
        let self = this,
            value = '',
            form = RadicalInstallerUtils.createElement('div');

            if(RadicalInstallerConfig.key !== '') {
                value = RadicalInstallerConfig.key;
            }

            form = form
            .addChild('div')
                .addChild('div', {'class': 'radicalinstaller-width-1-1'})
                    .addChild('form', {
                        'class': 'form-horizontal',
                        'events': [
                            [
                                'submit',
                                function (event) {
                                    event.preventDefault();


                                    let key_value = event.target.querySelector('[name=key]').value;

                                    if(key_value.length < 30)
                                    {
                                        RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_key, 'danger',5000);
                                        return;
                                    }

                                    // отправить аякс на сохранение ключа
                                    RadicalInstallerUtils.ajaxPost(RadicalInstaller.url + '&method=saveKey', {key: key_value})
                                        .done(function (response) {

                                            RadicalInstallerProject.sync({
                                                done: function(){
                                                    RadicalInstaller.showStart();
                                                }
                                            });

                                            RadicalInstallerConfig.key = key_value; // можем присвоить ключ, так как сервер примет только проверенный ключ
                                        })
                                        .fail(function (xhr) {
                                            let response = JSON.parse(xhr.responseText);

                                            if(response !== null && response.data[0] !== undefined) {
                                                RadicalInstallerUtils.createAlert(response.data[0], 'danger',5000);
                                                return;
                                            }

                                            RadicalInstallerUtils.createAlert(RadicalInstallerLangs.error_service, 'danger',5000);
                                        });

                                    return false;
                                }
                            ]
                        ]
                    })
                        .addChild('div', {'class': 'radicalinstaller-flex'})
                            .add('input', {
                                class: 'radicalinstaller-input-key radicalinstaller-width-500',
                                type: 'text',
                                placeholder: RadicalInstallerLangs.text_input_key,
                                name: 'key',
                                value: value
                            })
                            .add('button', {
                                class: 'ri-btn ri-btn-default ri-btn-primary ri-btn-large',
                                type: 'submit'
                            }, 'Сохранить')
                            .add('button', {
                                class: 'ri-btn ri-btn-default ri-btn-large',
                                type: 'submit',
                                events: [
                                    [
                                        'click',
                                        function(event) {
                                            document.querySelector('.radicalinstaller-input-key').value = '';
                                            event.preventDefault();
                                        }
                                    ]
                                ]
                            }, 'Очистить')
                            .getParent()
                        .getParent()
                    .getParent()
                .getParent()


        return form.build();
    },


    renderProjectGrid: function (args) {
        let grid = RadicalInstallerUtils.createElement('div'),
            current = 0,
            width = 4,
            close = false,
            grid_row_id = RadicalInstallerUtils.randomInteger(1111111111, 9999999999),
            items = [];

        if (window.matchMedia("(max-width: 2100px)").matches) {
            width = 3;
        }

        grid = grid.addChild('div', {class: 'radicalinstaller-grid radicalinstaller-grid-width-1-' + width, 'data-row': grid_row_id});

        for(let i=0;i<args.items.length;i++) {
            current++;
            close = false;
            items.push(args.items[i]);

            if (current >= width) {

                for(let j in items) {
                    grid = grid.add('div', {}, items[j]);
                }

                grid = grid.getParent();
                grid = grid.add('div', {class: 'radicalinstaller-logs', 'data-for-row': grid_row_id});

                if(
                    args.trigger_grid_row_end_for !== undefined &&
                    typeof args.trigger_grid_row_end_for === 'function'
                ) {
                    args.trigger_grid_row_end_for(items, grid_row_id);
                }

                grid_row_id = RadicalInstallerUtils.randomInteger(1111111111, 9999999999);
                grid = grid.addChild('div', {class: 'radicalinstaller-grid radicalinstaller-grid-width-1-' + width, 'data-row': grid_row_id});

                current = 0;
                close = true;
                items = [];
            }

        }


        if(!close) {

            for(let j in items) {
                grid = grid.add('div', {}, items[j]);
            }

            grid = grid.getParent();
            grid = grid.add('div', {class: 'radicalinstaller-logs', 'data-for-row': grid_row_id, 'data-row': grid_row_id});

            if(
                args.trigger_grid_row_end_for !== undefined &&
                typeof args.trigger_grid_row_end_for === 'function'
            ) {
                args.trigger_grid_row_end_for(items, grid_row_id);
            }

        } else {
            grid = grid.getParent();
        }

        return grid.build();
    },


    renderProjectCard: function (args) {
        let cover = '';
        let version = '';
        let version_last = '';
        let category = '';
        let id;
        let paid = 'free';

        if(args.images !== undefined && args.images.cover !== false) {
            cover = RadicalInstaller.api + '/' + args.images.cover
        }

        if(
            args.version !== undefined &&
            args.version !== null
        ) {

            if(args.version.version !== undefined) {
                version = args.version.version;
            } else {
                version = args.version;
            }

        }

        if(
            args.last_version !== undefined &&
            args.last_version !== null
        ) {
            let split = args.last_version.split('|');
            version_last = split[1];
        }

        if(args.id !== undefined) {
            id = args.id;
        }

        if(args.project_id !== undefined) {
            id = args.project_id;
        }

        if(args.download_type === 'paid') {
            paid = 'paid';
        }

        if(
            args.category !== undefined &&
            args.category  !== null &&
            args.category.title !== undefined &&
            args.category.title !== null
        ) {
            category = args.category.title;
        }

        let card = RadicalInstallerUtils
                .createElement('div', {class: 'radicalinstaller-project-card', 'data-project': id, 'data-paid': paid})
                .addChild('div', {class: 'radicalinstaller-project-card-image'});

                if(cover !== '') {
                    card.add('img', {src: cover})
                }

        card = card.getParent()
                .addChild('div', {class: 'radicalinstaller-project-card-info'})
                    .add('h4', {}, args.title);

        if (category !== '')
        {
            card = card.add('div', {}, 'Категория: ' + category);
        }

        if (version !== '')
        {
            card = card.addChild('div', {class: 'radicalinstaller-project-card-version'}, 'Версия: ')
                .add('span', {class: 'value'}, version)
                .add('span', {class: 'value-arrow ri-hidden'}, '->')
                .add('span', {class: 'value-last ri-hidden'}, version_last)
                .getParent();
        } else {
            card.addChild('div', {class: 'radicalinstaller-project-card-version ri-hidden'}, 'Версия: ')
                .add('span', {class: 'value'}, version)
                .add('span', {class: 'value-arrow ri-hidden'}, '->')
                .add('span', {class: 'value-last ri-hidden'}, version_last)
                .getParent();
        }

        card = card .addChild('div', {class: 'ri-btn-group ri-btn-group-small'})
                        .add('button', {
                            type: 'button',
                            class: 'ri-btn ri-btn-install ri-btn-success',
                            disabled: 'disabled',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        let button_install = this;
                                        let button_delete = this.closest('.radicalinstaller-project-card').querySelector('.ri-btn-delete');
                                        let logs_id = this.getAttribute('data-connect-logs-id');
                                        let logs_container = RadicalInstallerUI.container.querySelector('.radicalinstaller-logs[data-for-row="' + logs_id + '"]');
                                        logs_container.innerHTML = '';

                                        button_install.setAttribute('disabled', 'disabled');
                                        button_install.innerHTML = 'Устанавливается';

                                        RadicalInstallerProject.install({
                                            ids: [id],
                                            success: function (response, project_install_id, position) {
                                                let success = false;
                                                let data = JSON.parse(response.data);

                                                if (data.messages !== undefined && data.messages !== null) {
                                                    for (let i = data.messages.length - 1; i >= 0; i--) {
                                                        logs_container.innerHTML += '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>';
                                                    }
                                                }

                                                if (response.success === true) {
                                                    if (data.status === undefined || data.status === null || data.status === 'fail') {
                                                        success = false;
                                                    } else {
                                                        success = true;
                                                    }
                                                }

                                                if(success) {
                                                    button_install.innerHTML = 'Переустановить';

                                                    if(
                                                        button_delete !== undefined &&
                                                        button_delete !== null
                                                    ) {
                                                        button_delete.classList.remove('ri-hidden');
                                                        button_delete.removeAttribute('disabled');
                                                    }
                                                } else {
                                                    button_install.innerHTML = 'Установить';
                                                }

                                                button_install.removeAttribute('disabled');
                                            }
                                        });
                                    }
                                ]
                            ]
                        }, 'Установить')
                        .add('button', {
                            type: 'button',
                            class: 'ri-btn ri-btn-delete ri-btn-danger ri-hidden',
                            events: [
                                [
                                    'click',
                                    function (event) {

                                        let button_install = this.closest('.radicalinstaller-project-card').querySelector('.ri-btn-install');
                                        let button_delete = this;
                                        let logs_id = this.getAttribute('data-connect-logs-id');
                                        let logs_container = RadicalInstallerUI.container.querySelector('.radicalinstaller-logs[data-for-row="' + logs_id + '"]');
                                        logs_container.innerHTML = '';

                                        button_delete.setAttribute('disabled', 'disabled');
                                        button_delete.innerHTML = 'Удаляется';

                                        RadicalInstallerProject.install({
                                            ids: [id],
                                            success: function (response, project_install_id, position) {
                                                let success = false;
                                                let data = JSON.parse(response.data);

                                                if (data.messages !== undefined && data.messages !== null) {
                                                    for (let i = data.messages.length - 1; i >= 0; i--) {
                                                        logs_container.innerHTML += '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>';
                                                    }
                                                }

                                                if (response.success === true) {
                                                    if (data.status === undefined || data.status === null || data.status === 'fail') {
                                                        success = false;
                                                    } else {
                                                        success = true;
                                                    }
                                                }

                                                button_delete.innerHTML = 'Удалить';

                                                if(success) {
                                                    button_delete.classList.add('ri-hidden');

                                                    if(
                                                        button_install !== undefined &&
                                                        button_install !== null
                                                    ) {
                                                        button_install.innerHTML = 'Установить';
                                                    }
                                                }

                                                button_delete.removeAttribute('disabled');
                                            }
                                        });

                                    }
                                ]
                            ]
                        }, 'Удалить')
                        .add('button', {
                            type: 'button',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        let id = args.id;

                                        if(args.project_id !== undefined) {
                                            id = args.project_id;
                                        }

                                        RadicalInstaller.showProject(id);
                                    }
                                ]
                            ]
                        }, '?')
                        .getParent()
                    .getParent()

        return card.build();
    },


    renderAlert: function (args) {
        return '';
    },


    renderLoader: function () {
        return RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-loader'})
                .add('img', {'src': RadicalInstaller.assets + '/img/loader.svg'}).build();

    }

};
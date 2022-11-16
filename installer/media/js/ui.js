window.SovmartUI = {

    container: null,
    container_page: null,
    container_toolbar: null,
    container_form_key: null,
    container_loader: null,
    icons_sprite: '/media/plg_installer_sovmart/img/sprite.svg',


    loaderShow: function (args) {
        let loader = SovmartUtils.createElement('div', {}, this.renderLoader()).build();
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


        if (args.buttons !== undefined) {
            this.container_toolbar.innerHTML = '';
            this.container_toolbar.appendChild(this.renderToolbar(args.buttons));
        }

        if (args.page !== undefined) {

            this.container_page.innerHTML = '';

            if (args.page.length > 0) {
                for (let k = 0; k < args.page.length; k++) {
                    this.container_page.appendChild(args.page[k]);
                }

                return;
            }

            this.container_page.appendChild(args.page);
        }

    },


    getContainerToolbar: function () {
        return this.container_toolbar;
    },


    getContainerPage: function () {
        return this.container_page;
    },


    renderToolbar: function (args) {
        let toolbar = SovmartUtils.createElement('div', {class: 'radicalinstaller-toolbar radicalinstaller-flex radicalinstaller-child-margin-right-small'});

        if (args.groups !== undefined) {

            for (let k = 0; k < args.groups.length; k++) {
                toolbar.add('div', null, SovmartUI.renderToolbarGroup(args.groups[k]));
            }

            return toolbar.build();
        }

        toolbar.add('div', null, SovmartUI.renderToolbarGroup({name: 'default', items: args}));

        return toolbar.build();
    },


    renderToolbarGroup: function (buttons) {
        if (
            buttons.items === undefined ||
            buttons.items === null
        ) {
            return '';
        }

        let group = SovmartUtils.createElement('div', {class: 'ri-btn-group'});

        for (let k = 0; k < buttons.items.length; k++) {

            if (
                buttons.items[k].dropdown !== undefined &&
                buttons.items[k].items !== undefined
            ) {
                group = group.addChild('div', {class: 'ri-btn-wrap'});
                group = group.add('button', {
                        'type': 'button',
                        'events': buttons.items[k].dropdown.events,
                        'class': buttons.items[k].dropdown.class
                    },
                    SovmartUI.renderButtonIcon(buttons.items[k].dropdown)
                );
                group = group.addChild('div', {class: 'ri-btn-dropdown'});

                for (let i = 0; i < buttons.items[k].items.length; i++) {
                    let prop = {'type': 'button'};
                    let label = SovmartUI.renderButtonIcon(buttons.items[k].items[i]);

                    if (buttons.items[k].items[i].events !== undefined) {
                        prop.events = buttons.items[k].items[i].events;
                    }

                    if (buttons.items[k].items[i].class !== undefined) {
                        prop.class = buttons.items[k].items[i].class;
                    }

                    if (buttons.items[k].items[i].disabled !== undefined) {
                        prop.disabled = buttons.items[k].items[i].disabled;
                    }

                    group = group.add('button', prop, label);
                }

                group = group.getParent();
                group = group.getParent();
            } else {
                let prop = {'type': 'button'};

                if (buttons.items[k].events !== undefined) {
                    prop.events = buttons.items[k].events;
                }

                if (buttons.items[k].class !== undefined) {
                    prop.class = buttons.items[k].class;
                }

                if (buttons.items[k].disabled !== undefined) {
                    prop.disabled = buttons.items[k].disabled;
                }

                group = group.add('button', prop, SovmartUI.renderButtonIcon(buttons.items[k]));
            }

        }

        return group.build();
    },


    renderIcon(options) {
        if (
            options.name === undefined ||
            options.name === null
        ) {
            return '';
        }

        let size = 24,
            name = options.name;

        if (options.size !== undefined) {
            size = options.size;
        }

        return '<svg width="' + size + '" height="' + size + '"><use xlink:href="' + SovmartUI.icons_sprite + '#' + name + '"></use></svg>';
    },


    renderButtonIcon(button) {

        if (button.icon !== undefined) {
            let icon_position = 'left';
            let icon = '<svg width="20" height="20"><use xlink:href="' + SovmartUI.icons_sprite + '#' + button.icon + '"></use></svg>';
            let label = button.label;

            if (button.icon_position !== undefined) {
                icon_position = button.icon_position;
            }

            if (icon_position === 'left') {
                label = '<span class="radicalinstaller-margin-left-xsmall">' + button.label + '</span>';
                label = icon + label;
            }

            if (icon_position === 'right') {
                label = '<span class="radicalinstaller-margin-right-xsmall">' + button.label + '</span>';
                label += icon;
            }

            label = '<div class="radicalinstaller-flex radicalinstaller-flex-middle">' + label + '</div>';
            return label;
        }

        return button.label;
    },


    renderToolbarDropdown: function (buttons) {
        let dropdown = SovmartUtils.createElement('div', {class: 'ri-btn-dropdown'});

        for (let k = 0; k < buttons.length; k++) {
            dropdown = dropdown.add('button', {
                'type': 'button',
                'events': buttons[k].events,
                'class': buttons[k].class
            }, buttons[k].label);
        }

        dropdown = dropdown.getParent();

        return dropdown.build();
    },


    renderPage: function (args) {
        let page = SovmartUtils.createElement('div', {class: 'radicalinstaller-page'});
        return page.build();
    },


    renderAlert: function (args) {
        let alert = SovmartUtils.createElement('div', {class: 'radicalinstaller-alert radicalinstaller-alert-info'}, args.message);

        return alert.build();
    },


    renderGroup: function (args) {
        let logs_id = SovmartUtils.randomInteger(11111111, 9999999);
        let group = SovmartUtils
            .createElement('div', {class: 'radicalinstaller-group'});

        if (
            (args.label !== undefined && args.label !== '') ||
            args.buttons !== undefined
        ) {

            group = group.addChild('div', {class: 'radicalinstaller-group-header radicalinstaller-flex radicalinstaller-flex-middle'})
                .addChild('div', {class: 'radicalinstaller-width-auto radicalinstaller-margin-right'})
                .add('h3', {}, args.label)
                .getParent();

            if (args.buttons !== undefined) {
                group = group.addChild('div', {class: 'radicalinstaller-width-expand'});

                for (let k = 0; k < args.buttons.length; k++) {
                    group = group.add('button', {
                        'type': 'button',
                        'events': args.buttons[k].events,
                        'class': args.buttons[k].class,
                        'data-connect-logs-id': logs_id
                    }, args.buttons[k].label);
                }

                group = group.getParent();
            }

            group = group.getParent();
            group = group.add('div', {class: 'radicalinstaller-logs', 'data-for-row': logs_id});
        }

        if (
            (args.description !== undefined && args.description !== '')
        )
        {
            group = group.addChild('div', {class: 'radicalinstaller-group-description'})
                .add('div', {}, args.description)
                .getParent();
        }

        if (args.groups !== undefined) {

            for (let k = 0; k < args.groups.length; k++) {
                group = group.addChild('div', {class: 'radicalinstaller-group-subgroup ' + args.groups[k].class})
                    .addChild('div', {class: 'radicalinstaller-margin-bottom radicalinstaller-flex radicalinstaller-flex-middle'})
                    .addChild('div', {class: 'radicalinstaller-width-auto radicalinstaller-margin-right'})
                    .add('h4', {}, args.groups[k].label)
                    .getParent();

                if (args.groups[k].buttons !== undefined) {
                    group = group.addChild('div', {class: 'radicalinstaller-width-expand'});

                    for (let j = 0; j < args.groups[k].buttons.length; j++) {
                        group = group.add('button', {
                            'type': 'button',
                            'events': args.groups[k].buttons[j].events,
                            'class': args.groups[k].buttons[j].class,
                            'data-connect-logs-id': logs_id
                        }, args.groups[k].buttons[j].label);
                    }

                    group = group.getParent();
                }

                group = group.getParent();
                group = group.add('div', {}, args.groups[k].content)
                    .getParent();
            }

        } else {
            group = group.add('div', {class: 'radicalinstaller-group-content'}, args.content);
        }

        if (args.actions !== undefined) {
            group = group.addChild('div', {class: 'radicalinstaller-group-actions'});


            for (let k = 0; k < args.actions.length; k++) {
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
            form = SovmartUtils.createElement('div');

        if (SovmartConfig.key !== '') {
            value = SovmartConfig.key;
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

                            if (key_value.length < 30 && key_value.length !== 0) {
                                SovmartUtils.createAlert(SovmartLangs.text_key_error, 'danger', 5000);
                                return;
                            }

                            // отправить аякс на сохранение ключа
                            SovmartUtils.ajaxPost(Sovmart.url + '&method=saveKey', {key: key_value})
                                .done(function (response) {

                                    SovmartProject.sync({
                                        done: function () {
                                            Sovmart.showStart();
                                        }
                                    });

                                    SovmartConfig.key = key_value; // можем присвоить ключ, так как сервер примет только проверенный ключ
                                })
                                .fail(function (xhr) {
                                    let response = JSON.parse(xhr.responseText);

                                    if (response !== null && response.data[0] !== undefined) {
                                        SovmartUtils.createAlert(response.data[0], 'danger', 5000);
                                        return;
                                    }

                                    SovmartUtils.createAlert(SovmartLangs.alert_service_error, 'danger', 5000);
                                });

                            return false;
                        }
                    ]
                ]
            })
            .addChild('div', {'class': 'radicalinstaller-flex'})
            .add('input', {
                class: 'radicalinstaller-input-key radicalinstaller-width-500 radicalinstaller-margin-right-xsmall',
                type: 'text',
                placeholder: SovmartLangs.text_input_key,
                name: 'key',
                value: value
            })
            .addChild('div', {class: 'ri-btn-group'})
            .add('button', {
                class: 'ri-btn ri-btn-default ri-btn-primary ri-btn-large',
                type: 'submit'
            }, SovmartLangs.key_view)
            .add('button', {
                class: 'ri-btn ri-btn-default ri-btn-large',
                type: 'submit',
                events: [
                    [
                        'click',
                        function (event) {
                            document.querySelector('.radicalinstaller-input-key').value = '';
                        }
                    ]
                ]
            }, SovmartLangs.clean)
            .getParent()
            .getParent()
            .getParent()
            .getParent()
            .getParent()


        return form.build();
    },


    renderProjectGrid: function (args) {
        let grid = SovmartUtils.createElement('div'),
            current = 0,
            width = 5,
            close = false,
            grid_row_id = SovmartUtils.randomInteger(1111111111, 9999999999),
            items = [];

        if (window.matchMedia("(max-width: 2100px)").matches) {
            width = 4;
        }

        grid = grid.addChild('div', {
            class: 'radicalinstaller-grid radicalinstaller-grid-width-1-' + width,
            'data-row': grid_row_id
        });

        for (let i = 0; i < args.items.length; i++) {
            current++;
            close = false;
            items.push(args.items[i]);

            if (current >= width) {

                for (let j = 0; j < items.length; j++) {
                    grid = grid.add('div', {}, items[j]);
                }

                grid = grid.getParent();
                grid = grid.add('div', {class: 'radicalinstaller-logs', 'data-for-row': grid_row_id});

                if (
                    args.trigger_grid_row_end_for !== undefined &&
                    typeof args.trigger_grid_row_end_for === 'function'
                ) {
                    args.trigger_grid_row_end_for(items, grid_row_id);
                }

                grid_row_id = SovmartUtils.randomInteger(1111111111, 9999999999);
                grid = grid.addChild('div', {
                    class: 'radicalinstaller-grid radicalinstaller-grid-width-1-' + width,
                    'data-row': grid_row_id
                });

                current = 0;
                close = true;
                items = [];
            }

        }


        if (!close) {

            for (let j = 0; j < items.length; j++) {
                grid = grid.add('div', {}, items[j]);
            }

            grid = grid.getParent();
            grid = grid.add('div', {
                class: 'radicalinstaller-logs',
                'data-for-row': grid_row_id,
                'data-row': grid_row_id
            });

            if (
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
        let cover = '/media/plg_installer_sovmart/img/extension.svg';
        let cover_class = 'icon';
        let version = '';
        let version_last = '';
        let category = '';
        let category_id = 0;
        let description = 'Описание отсутствует';
        let id;
        let paid = 'free';

        if (
            args.images !== undefined &&
            args.images.cover !== false &&
            args.images.cover !== ''
        ) {
            cover = Sovmart.api + '/' + args.images.cover;
            cover_class = 'cover';
        }

        if (
            args.cover !== undefined &&
            args.cover !== ''
        ) {
            cover = Sovmart.api + '/' + args.cover;
            cover_class = 'cover';
        }

        if (
            args.version !== undefined &&
            args.version !== null
        ) {

            if (args.version.version !== undefined) {
                version = args.version.version;
            } else {
                version = args.version;
            }

        }

        if (
            args.last_version !== undefined &&
            args.last_version !== null
        ) {
            let split = args.last_version.split('|');
            version_last = split[1];
        }

        if (args.id !== undefined) {
            id = args.id;
        }

        if (args.project_id !== undefined) {
            id = args.project_id;
        }

        if (args.introtext !== undefined && args.introtext !== '') {
            description = args.introtext;
        }

        if (args.download_type === 'paid') {
            paid = 'paid';
        }

        if (
            args.category !== undefined &&
            args.category !== null &&
            args.category.id !== undefined &&
            args.category.id !== null
        ) {
            category_id = parseInt(args.category.id);
        }

        if (
            args.catid !== undefined &&
            args.catid !== null
        ) {
            category_id = parseInt(args.catid);
        }

        let categories_list = [];
        let categories = SovmartUtils
            .createElement('div', {class: 'radicalinstaller-project-categories'});

        if(category_id > 0)
        {
            for(let i=0;i<Sovmart.categories.length;i++) {
                if(Sovmart.categories[i].id !== category_id) {
                    continue;
                }

                categories_list.push({
                    id: Sovmart.categories[i].id,
                    title: Sovmart.categories[i].title
                });

                if(Sovmart.categories[i].level <= 1) {
                    continue;
                }

                let level_current = Sovmart.categories[i].level;

                for(let j=i;j>=0;j--) {

                    if(Math.abs(level_current - Sovmart.categories[j].level) === 0) {
                        continue;
                    }

                    level_current = Sovmart.categories[j].level;

                    categories_list.unshift({
                        id: Sovmart.categories[j].id,
                        title: Sovmart.categories[j].title
                    });
                }
            }

            for (let i=0;i<categories_list.length;i++) {
                categories.add('a', {'data-id': categories_list[i].id,
                    'events': [
                        [
                            'click', function (event) {
                                Sovmart.showCategory(categories_list[i].id)
                                event.preventDefault();
                            }
                        ]
                    ]
                }, categories_list[i].title);
            }
        }

        let card = SovmartUtils
            .createElement('div', {class: 'radicalinstaller-project-card', 'data-project': id, 'data-paid': paid})
            .addChild('div', {class: 'radicalinstaller-project-card-header'})
            .addChild('div', {class: 'radicalinstaller-project-card-image'});

        if (cover !== '') {
            card = card.add('img', {src: cover, class: cover_class})
        }


        card = card.getParent()
            .addChild('div', {class: 'radicalinstaller-project-card-info'})
            .add('h4', {}, args.title);

        if (version !== '') {
            card = card.addChild('div', {class: 'radicalinstaller-project-card-version radicalinstaller-flex radicalinstaller-flex-middle'})
                .add('span', {class: 'radicalinstaller-margin-right-xsmall'}, SovmartLangs.version)
                .add('span', {class: 'value'}, version)
                .add('span', {class: 'value-arrow ri-hidden'}, SovmartUI.renderIcon({
                    name: 'ri-arrow-right',
                    size: 17
                }))
                .add('span', {class: 'value-last ri-hidden'}, version_last)
                .getParent();
        } else {
            card.addChild('div', {class: 'radicalinstaller-project-card-version radicalinstaller-flex radicalinstaller-flex-middle ri-hidden'})
                .add('span', {class: 'radicalinstaller-margin-right-xsmall'}, SovmartLangs.version)
                .add('span', {class: 'value'}, version)
                .add('span', {class: 'value-arrow ri-hidden'}, SovmartUI.renderIcon({
                    name: 'ri-arrow-right',
                    size: 17
                }))
                .add('span', {class: 'value-last ri-hidden'}, version_last)
                .getParent();
        }

        card = card
            .getParent()
            .getParent()
            .add('div', {}, categories.build())
            .add('div', {class: 'radicalinstaller-project-card-description'}, description);

        card = card.addChild('div', {class: 'radicalinstaller-project-card-actions'})
            .addChild('div', {class: 'ri-btn-group ri-btn-group-small'})
            .add('button', {
                type: 'button',
                class: 'ri-btn ri-btn-default',
                events: [
                    [
                        'click',
                        function (event) {
                            let id = args.id;

                            if (args.project_id !== undefined) {
                                id = args.project_id;
                            }

                            Sovmart.showProject(id);
                        }
                    ]
                ]
            }, SovmartUI.renderIcon({name: 'ri-info', size: 18}))
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
                            let logs_container = SovmartUI.container.querySelector('.radicalinstaller-logs[data-for-row="' + logs_id + '"]');
                            logs_container.innerHTML = '';

                            button_delete.setAttribute('disabled', 'disabled');

                            SovmartProject.delete({
                                id: [id],
                                success: function (response, project_delete_id) {
                                    let success = false;
                                    let data = response;


                                    if (
                                        data.messages !== undefined && data.messages !== null &&
                                        data.messages.length > 0
                                    ) {
                                        logs_container.append(SovmartUI.renderLogsClose());

                                        for (let i = data.messages.length - 1; i >= 0; i--) {
                                            logs_container.append(
                                                SovmartUtils.createElement(
                                                    'div',
                                                    {},
                                                    '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>'
                                                ).build()
                                            );
                                        }
                                    }

                                    if (data.status === undefined || data.status === null || data.status === 'fail') {
                                        success = false;
                                    } else {
                                        success = true;
                                    }

                                    if (success) {
                                        button_delete.classList.add('ri-hidden');

                                        if (
                                            button_install !== undefined &&
                                            button_install !== null
                                        ) {
                                            button_install.innerHTML = SovmartLangs.install;
                                        }

                                        Sovmart.checkUpdatedProjects(false);
                                    }

                                    button_delete.removeAttribute('disabled');
                                },
                                fail: function () {
                                    button_delete.removeAttribute('disabled');
                                    logs_container.append(SovmartUI.renderLogsClose());
                                    logs_container.append(
                                        SovmartUtils.createElement(
                                            'div',
                                            {},
                                            '<div class="alert alert-danger">' + SovmartLangs.text_delete_error + '</div>'
                                        ).build()
                                    );
                                },
                                cancel: function() {
                                    button_delete.removeAttribute('disabled');
                                }
                            });

                        }
                    ]
                ]
            }, SovmartUI.renderIcon({name: 'ri-trash', size: 18}))
            .getParent()
            .add('button', {
                type: 'button',
                class: 'ri-btn ri-btn-install ri-btn-success ri-btn-small',
                disabled: 'disabled',
                events: [
                    [
                        'click',
                        function (event) {
                            let button_install = this;
                            let button_delete = this.closest('.radicalinstaller-project-card').querySelector('.ri-btn-delete');
                            let logs_id = this.getAttribute('data-connect-logs-id');
                            let logs_container = SovmartUI.container.querySelector('.radicalinstaller-logs[data-for-row="' + logs_id + '"]');
                            logs_container.innerHTML = '';

                            button_install.setAttribute('disabled', 'disabled');
                            button_install.innerHTML = SovmartLangs.install_process;

                            SovmartProject.install({
                                ids: [id],
                                success: function (responses) {
                                    let success = false;
                                    let data = [];
                                    data = JSON.parse(responses[0].data);

                                    if (
                                        data.messages !== undefined &&
                                        data.messages !== null &&
                                        data.messages.length > 0
                                    ) {
                                        logs_container.append(SovmartUI.renderLogsClose());

                                        for (let i = data.messages.length - 1; i >= 0; i--) {
                                            logs_container.append(
                                                SovmartUtils.createElement(
                                                    'div',
                                                    {},
                                                    '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>'
                                                ).build()
                                            );
                                        }
                                    }

                                    if (responses[0].success === true) {
                                        if (data.status === undefined || data.status === null || data.status === 'fail') {
                                            success = false;
                                        } else {
                                            success = true;
                                        }
                                    }

                                    if (success) {
                                        button_install.innerHTML = SovmartLangs.reinstall;

                                        if (
                                            button_delete !== undefined &&
                                            button_delete !== null
                                        ) {
                                            button_delete.classList.remove('ri-hidden');
                                            button_delete.removeAttribute('disabled');
                                        }

                                        Sovmart.checkUpdatedProjects(false);

                                    } else {
                                        button_install.innerHTML = SovmartLangs.install;
                                    }

                                    button_install.removeAttribute('disabled');
                                },
                                fail: function (responses) {
                                    button_install.innerHTML = SovmartLangs.install;
                                    button_install.removeAttribute('disabled');
                                    logs_container.append(SovmartUI.renderLogsClose());
                                    logs_container.append(
                                        SovmartUtils.createElement(
                                            'div',
                                            {},
                                            '<div class="alert alert-danger">' + SovmartLangs.text_install_error + '</div>'
                                        ).build()
                                    );
                                }
                            });
                        }
                    ]
                ]
            }, SovmartLangs.install)
            .getParent()

        return card.build();
    },


    renderAccordeon: function (args) {
        let container = SovmartUtils.createElement('div', {class: 'ri-tabs'});

        for (let i = 0; i < args.items.length; i++) {
            container = container
                .addChild('div', {class: 'ri-tab'})
                .add('input', {type: 'checkbox', id: 'chck' + i})
                .add('label', {class: 'ri-tab-label', 'for': 'chck' + i}, args.items[i].label)
                .add('div', {class: 'ri-tab-content'}, args.items[i].content)
                .getParent();
        }

        return container.build();
    },

    renderLogsClose: function (args) {
        let wrap = SovmartUtils.createElement('div');

        wrap = wrap.add('button', {
            type: 'button',
            class: 'ri-btn ri-btn-primary',
            events: [
                [
                    'click',
                    function (event) {
                        let wrap_logs = this.closest('.radicalinstaller-logs');
                        if (wrap_logs !== undefined && wrap_logs !== null) {
                            wrap_logs.innerHTML = '';
                        }
                    }
                ]
            ]
        }, SovmartLangs.message_close)

        return wrap.build();
    },


    renderLoader: function () {
        return SovmartUtils.createElement('div', {'class': 'radicalinstaller-loader radicalinstaller-flex radicalinstaller-flex-center radicalinstaller-flex-middle'})
            .add('img', {'src': Sovmart.assets + '/img/loader.svg'}).build();

    }

};
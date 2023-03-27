window.SovmartUI = {

    container: null,

    container_page: null,

    container_toolbar: null,

    container_header: null,

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

    getPage: function () {
        return this.container_page;
    },

    getContainerToolbar: function () {
        return this.container_toolbar;
    },

    renderToolbar: function (args) {
        let toolbar = SovmartUtils.createElement('div', {class: 'sovmart-toolbar sovmart-flex sovmart-child-margin-right-small'});

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

                let type = 'button';

                if(buttons.items[k].type !== undefined) {
                    type = buttons.items[k].type;
                }

                if(type === 'button') {

                    group = group.addChild('div', {class: 'ri-dropdown-wrap'});
                    group = group.add('button', {
                            'type': 'button',
                            'events': buttons.items[k].dropdown.events,
                            'class': buttons.items[k].dropdown.class
                        },
                        SovmartUI.renderButtonIcon(buttons.items[k].dropdown)
                    );
                    group = group.addChild('div', {class: 'ri-dropdown'});

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
                }

                //if(type === 'forminput') {}
            } else {

                let type = 'button';

                if(buttons.items[k].type !== undefined) {
                    type = buttons.items[k].type;
                }

                if(type === 'button') {
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


                if(type === 'forminput') {
                    group = group.addChild('form', {class: 'ri-toolbar-form', events: buttons.items[k].events})
                        .add('input', {class: 'ri-input', placeholder: buttons.items[k].label, type: 'text'})
                        .getParent();
                }

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
                label = '<span class="sovmart-margin-left-xsmall">' + button.label + '</span>';
                label = icon + label;
            }

            if (icon_position === 'right') {
                label = '<span class="sovmart-margin-right-xsmall">' + button.label + '</span>';
                label += icon;
            }

            label = '<div class="sovmart-flex sovmart-flex-middle">' + label + '</div>';
            return label;
        }

        return button.label;
    },

    renderPage: function (args) {
        let page = SovmartUtils.createElement('div', {class: 'sovmart-page'});
        return page.build();
    },

    renderAlert: function (args) {
        let alert = SovmartUtils.createElement('div', {class: 'sovmart-alert sovmart-alert-info'}, args.message);

        return alert.build();
    },

    renderGroup: function (args) {
        let logs_id = SovmartUtils.randomInteger(11111111, 9999999);
        let group = SovmartUtils
            .createElement('div', {class: 'sovmart-group'});

        if (
            (args.label !== undefined && args.label !== '') ||
            args.buttons !== undefined
        ) {

            group = group.addChild('div', {class: 'sovmart-group-header sovmart-flex sovmart-flex-middle'})
                .addChild('div', {class: 'sovmart-width-auto sovmart-margin-right'});

            if(args.label !== undefined && args.label !== '')
            {
                group = group.add('h3', {}, args.label);
            }

            group = group.getParent();

            if (args.buttons !== undefined) {
                group = group.addChild('div', {class: 'sovmart-width-expand'});

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
            group = group.add('div', {class: 'sovmart-logs', 'data-for-row': logs_id});
        }

        if (
            (args.description !== undefined && args.description !== '')
        )
        {
            group = group.addChild('div', {class: 'sovmart-group-description'})
                .add('div', {}, args.description)
                .getParent();
        }

        if (args.groups !== undefined) {

            for (let k = 0; k < args.groups.length; k++) {
                let content = args.groups[k].content;

                group = group.addChild('div', {class: 'sovmart-group-subgroup ' + args.groups[k].class});

                if(
                    args.groups[k]['accordeon'] !== undefined &&
                    args.groups[k]['accordeon']['label'] !== undefined &&
                    args.groups[k]['accordeon']['label_close'] !== undefined
                ) {
                    let accordeon_item = {
                        label: args.groups[k]['accordeon']['label'],
                        label_close: args.groups[k]['accordeon']['label_close'],
                        label_class: 'ri-btn-default',
                        content: content
                    };

                    if (args.groups[k].buttons !== undefined) {
                        accordeon_item.buttons = [];
                        for (let j = 0; j < args.groups[k].buttons.length; j++) {
                            accordeon_item.buttons.push(
                                {
                                    'type': 'button',
                                    'label': args.groups[k].buttons[j].label,
                                    'events': args.groups[k].buttons[j].events,
                                    'class': args.groups[k].buttons[j].class,
                                    'data-connect-logs-id': logs_id
                                }
                            );
                        }
                    }

                    content = SovmartUI.renderToggle(accordeon_item);

                } else {

                    group = group.addChild('div', {class: 'sovmart-margin-bottom sovmart-flex sovmart-flex-middle'})

                    if(
                        args.groups[k].label !== undefined &&
                        args.groups[k].label !== ''
                    )
                    {
                        group = group
                            .addChild('div', {class: 'sovmart-width-auto sovmart-margin-right'})
                            .add('h4', {}, args.groups[k].label)
                            .getParent();
                    }

                    if (args.groups[k].buttons !== undefined) {
                        group = group.addChild('div', {class: 'sovmart-width-expand'});

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
                }

                group = group.add('div', {}, content).getParent();

            }

        } else {
            group = group.add('div', {class: 'sovmart-group-content'}, args.content);
        }

        if (args.actions !== undefined) {
            group = group.addChild('div', {class: 'sovmart-group-actions'});


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

    renderFormSearch: function () {
        let form = SovmartUtils.createElement('div');

        form = form
            .addChild('div')
            .addChild('form', {
                'class': 'form-horizontal',
                'events': [
                    [
                        'submit',
                        function (event) {
                            event.preventDefault();
                            event.preventDefault();
                            let form = this;
                            let q = form.querySelector('input').value;
                            let page = SovmartUI.renderPage();

                            if(q.length < 3)
                            {
                                SovmartUtils.createAlert(
                                    SovmartLangs.text_search_error_small,
                                    'danger',
                                    5000
                                );

                                return;
                            }

                            SovmartUI.showPage({
                                page: page
                            });

                            SovmartUI.loaderShow({
                                container: page,
                                wait: function (resolve, reject) {

                                    SovmartUtils.ajaxGet(Sovmart.url + '&method=search&q=' + encodeURIComponent(q))
                                        .done(function (response) {
                                            let data = JSON.parse(response.data);
                                            resolve(data);
                                        }).fail(function (xhr) {
                                        reject(xhr);
                                    });

                                }
                            }).then(items => {
                                let grid = '';
                                let projects_card = [];
                                let ids = [];

                                for (let k = 0; k < items.data.length; k++) {
                                    projects_card.push(
                                        SovmartUI.renderProjectCard(items.data[k].attributes)
                                    );
                                    ids.push(items.data[k].attributes.id);
                                }

                                grid = SovmartUI.renderProjectGrid({
                                    items: projects_card,
                                    trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                                });

                                page.appendChild(SovmartUI.renderGroup({
                                    label: SovmartLangs.text_search_by + q,
                                    content: grid
                                }));

                                SovmartProject.checkInstall({
                                    ids: ids,
                                    done: Sovmart.checkInstallProjectCard
                                });

                            });
                        }
                    ]
                ]
            })
            .addChild('div', {'class': 'sovmart-flex'})
            .add('input', {
                class: 'ri-input ri-input-large sovmart-input-key sovmart-width-500 sovmart-margin-right-xsmall',
                type: 'text',
                placeholder: SovmartLangs.search,
                name: 'q',
            })
            .addChild('div', {class: 'ri-btn-group'})
            .add('button', {
                class: 'ri-btn ri-btn-default ri-btn-primary ri-btn-large',
                type: 'submit'
            }, SovmartLangs.find)
            .add('button', {
                class: 'ri-btn ri-btn-default ri-btn-large',
                type: 'button',
                events: [
                    [
                        'click',
                        function (event) {
                            event.preventDefault();
                            document.querySelector('.sovmart-input-key').value = '';
                            Sovmart.showStart();
                        }
                    ]
                ]
            }, SovmartLangs.clean)
            .getParent()
            .getParent()
            .getParent()
            .getParent()


        return form.build();
    },

    renderNoAuth: function () {
        let form = SovmartUtils
            .createElement('div')
            .add('p', {}, 'Получить токен вы можете в личном кабинете на <a href="https://sovmart.ru/lk" target="_blank">SovMart</a>')
            .addChild('form', {
                events: [
                    [
                        'submit',
                        function (event) {
                            event.preventDefault();

                            let token_value = event.target.querySelector('[name=token]').value;

                            if(token_value === '') {
                                SovmartUtils.createAlert('Пустой токен не допускается', 'danger', 5000);
                                return;
                            }

                            SovmartUtils.ajaxPost(Sovmart.url + '&method=savetoken', {token: token_value})
                                .done(function (response) {
                                    Sovmart.reload();
                                })
                                .fail(function (xhr) {
                                    let response = JSON.parse(xhr.responseText);

                                    if (response !== null && response.data !== undefined) {
                                        SovmartUtils.createAlert(response.data, 'danger', 5000);
                                        return;
                                    }

                                    SovmartUtils.createAlert(SovmartLangs.alert_service_error, 'danger', 5000);
                                });

                            return false;
                        }
                    ]
                ]
            })
            .addChild('div', {class: 'sovmart-margin-bottom'})
            .add('input', {class: 'sovmart-width-1-1 ri-input ri-input-large', type: 'text', name: 'token', placeholder: SovmartLangs.text_token_input})
            .getParent()
            .addChild('div', {class: ''})
            .add('button', {type: 'submit', class: 'ri-btn ri-btn-primary ri-btn-large'}, SovmartLangs.login)
            .getParent()
            .getParent();

        let button = SovmartUtils.createElement('button', {type: 'button', class: 'ri-btn ri-btn-auth ri-btn-large', 'events': [
            ['click', function() {
                SovmartUtils.modal({container: this.container, header: 'Авторизация в сервисе', body: form.build()})
            }]
        ]}, SovmartLangs.auth);

        return button.build();
    },

    renderAuth: function () {
        let container = SovmartUtils
            .createElement('div');

        container = container.add('div', {}, SovmartLangs.hi + '<b>' + SovmartConfig.name + '</b>!')
            .addChild('div', {class: 'sovmart-text-right'})
            .add('a', {
                href: '#',
                events: [
                    [
                        'click',
                        function (event) {
                            event.preventDefault();

                            SovmartUtils.ajaxPost(Sovmart.url + '&method=savetoken', {token: ''})
                                .done(function (response) {
                                    Sovmart.reload();
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
                ]}, SovmartLangs.logout)
            .getParent();

        return container.build();
    },

    renderProjectGrid: function (args) {
        let grid = SovmartUtils.createElement('div'),
            current = 0,
            width = 5,
            close = false,
            grid_row_id = SovmartUtils.randomInteger(1111111111, 9999999999),
            items = [],
            count = args.items.length;

        if (window.matchMedia("(max-width: 2100px)").matches) {
            width = 4;
        }

        if (window.matchMedia("(max-width: 1500px)").matches) {
            width = 3;
        }

        if (window.matchMedia("(max-width: 968px)").matches) {
            width = 2;
        }

        grid = grid.addChild('div', {
            class: 'sovmart-grid sovmart-grid-width-1-' + width,
            'data-row': grid_row_id
        });

        for (let i = 0; i < count; i++) {
            current++;
            close = false;
            items.push(args.items[i]);

            if (current >= width) {

                for (let j = 0; j < items.length; j++) {
                    grid = grid.add('div', {}, items[j]);
                }

                grid = grid.getParent();
                grid = grid.add('div', {class: 'sovmart-logs', 'data-for-row': grid_row_id});

                if (
                    args.trigger_grid_row_end_for !== undefined &&
                    typeof args.trigger_grid_row_end_for === 'function'
                ) {
                    args.trigger_grid_row_end_for(items, grid_row_id);
                }

                if((i + 1) !== count) {
                    grid_row_id = SovmartUtils.randomInteger(1111111111, 9999999999);
                    grid = grid.addChild('div', {
                        class: 'sovmart-grid sovmart-grid-width-1-' + width,
                        'data-row': grid_row_id
                    });
                }

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
                class: 'sovmart-logs',
                'data-for-row': grid_row_id,
                'data-row': grid_row_id
            });

            if (
                args.trigger_grid_row_end_for !== undefined &&
                typeof args.trigger_grid_row_end_for === 'function'
            ) {
                args.trigger_grid_row_end_for(items, grid_row_id);
            }

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
            args.images !== undefined &&
            args.images.icon !== false &&
            args.images.icon !== ''
        ) {
            cover = Sovmart.api + '/' + args.images.icon;
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
            .createElement('div', {class: 'sovmart-project-categories'});

        if(category_id > 0)
        {
            let i_categories = Sovmart.categories.length - 1;
            let category_level = -1;

            while(i_categories >= 0)
            {
                if(Sovmart.categories[i_categories].id === category_id) {
                    category_level = Sovmart.categories[i_categories].level;
                } else {
                    if(
                        category_level < 0 ||
                        Sovmart.categories[i_categories].level === category_level
                    ) {
                        i_categories--;
                        continue;
                    }
                }

                if(Sovmart.categories[i_categories].level >= 1) {
                    categories_list.unshift(Sovmart.categories[i_categories]);
                }

                if(Sovmart.categories[i_categories].level <= 1) {
                    break;
                }

                i_categories--;
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
            .createElement('div', {class: 'sovmart-project-card', 'data-project': id, 'data-paid': paid})
            .addChild('div', {class: 'sovmart-project-card-header'})
            .addChild('div', {class: 'sovmart-project-card-image'});

        if (cover !== '') {
            card = card.add('img', {src: cover, class: cover_class})
        }

        if(paid === 'paid')
        {
            card = card.addChild('div', {class: 'sovmart-project-card-badge'})
                .add('div', {class: 'sovmart-project-card-badge-icon'}, SovmartLangs.icon_pay)
                .getParent();
        }

        card = card.getParent()
            .addChild('div', {class: 'sovmart-project-card-info'})
            .add('h4', {}, args.title);

        if (version !== '') {
            card = card.addChild('div', {class: 'sovmart-project-card-version sovmart-flex sovmart-flex-middle'})
                .add('span', {class: 'sovmart-margin-right-xsmall'}, SovmartLangs.version)
                .add('span', {class: 'value'}, version)
                .add('span', {class: 'value-arrow ri-hidden'}, SovmartUI.renderIcon({
                    name: 'ri-arrow-right',
                    size: 17
                }))
                .add('span', {class: 'value-last ri-hidden'}, version_last)
                .getParent();
        } else {
            card.addChild('div', {class: 'sovmart-project-card-version sovmart-flex sovmart-flex-middle ri-hidden'})
                .add('span', {class: 'sovmart-margin-right-xsmall'}, SovmartLangs.version)
                .add('span', {class: 'value'}, version)
                .add('span', {class: 'value-arrow ri-hidden'}, SovmartUI.renderIcon({
                    name: 'ri-arrow-right',
                    size: 17
                }))
                .add('span', {class: 'value-last ri-hidden'}, version_last)
                .getParent();
        }

        card = card.getParent().getParent();

        card = card.addChild('div', {class: 'sovmart-project-card-actions'})
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

                            let button_install = this.closest('.sovmart-project-card').querySelector('.ri-btn-install');
                            let button_delete = this;
                            let logs_id = this.getAttribute('data-connect-logs-id');
                            let logs_container = SovmartUI.container.querySelector('.sovmart-logs[data-for-row="' + logs_id + '"]');
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
                            let button_delete = this.closest('.sovmart-project-card').querySelector('.ri-btn-delete');
                            let logs_id = this.getAttribute('data-connect-logs-id');
                            let logs_container = SovmartUI.container.querySelector('.sovmart-logs[data-for-row="' + logs_id + '"]');
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

        card = card
            .addChild('div', {class: 'sovmart-project-card-more-wrap'} )
            .addChild('div', {class: 'sovmart-project-card-more'} )
            .add('div', {}, categories.build())
            .add('div', {class: 'sovmart-project-card-description'}, description)
            .getParent()
            .getParent();

        return card.build();
    },

    renderDropdownButton: function (args) {
        return SovmartUtils
            .createElement('div', {class: 'ri-dropdown-wrap'})
            .add('button', {type: 'button', class: 'ri-btn ri-btn-' + (args.button !== undefined ? args.button : 'default') + ' ' + (args.button_class !== undefined ? args.button_class : ''), events: (args.click !== undefined ? [['click', args.click]] : [])}, args.label)
            .addChild('div', {
                class: 'ri-dropdown ri-dropdown-' + (args.position !== undefined ? args.position : 'left') + ' ' + (args.padding !== undefined ? 'sovmart-padding-small' : '')
            })
            .add('div', {}, args.content)
            .getParent()
            .build();
    },

    renderToggle: function (args) {
        let class_add = args.class !== undefined ? args.class : '';
        let container = SovmartUtils.createElement('div', {class: 'ri-toggle ' + class_add});
        let random_integer = SovmartUtils.randomInteger(11111111, 99999999);

        container = container
            .addChild('div', {class: 'ri-toogle'})
            .add('input', {type: 'checkbox', id: 'chck' + random_integer});

        if(args.buttons !== undefined) {
            container = container.addChild('div', {class: 'ri-toggle-buttons'})

            for (let k = 0; k < args.buttons.length; k++) {
                container = container.add('button', args.buttons[k], args.buttons[k].label)
            }

            container = container.getParent();
        }

        container = container.add('label', {class: 'ri-toggle-label ri-btn ' + (args.label_class !== undefined ? args.label_class : ''), 'for': 'chck' + random_integer, 'data-open': args.label, 'data-close': args.label_close !== undefined ? args.label_close : 'Свернуть' })
            .add('div', {class: 'ri-toggle-content'}, args.content)
            .getParent();

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
                        let wrap_logs = this.closest('.sovmart-logs');
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
        return SovmartUtils.createElement('div', {'class': 'sovmart-loader sovmart-flex sovmart-flex-center sovmart-flex-middle'})
            .add('img', {'src': Sovmart.assets + '/img/loader.svg'}).build();

    }

};
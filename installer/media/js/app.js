window.Sovmart = {

    api: 'https://sovmart.ru',

    url: 'index.php?option=com_ajax&plugin=sovmart&group=installer&format=json',

    assets: '/media/plg_installer_sovmart/',

    categories: [],

    buttons_page_main: {},

    installer_service_id: 24,

    init: function () {
        SovmartUI.container = document.querySelector('#sovmart-container');
        SovmartUI.container_header = SovmartUI.container.querySelector('.sovmart-header');
        SovmartUI.container_toolbar = SovmartUI.container.querySelector('.sovmart-toolbar');
        SovmartUI.container_page = SovmartUI.container.querySelector('.sovmart-page');

        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: [],
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {
                SovmartUtils.ajaxGet(Sovmart.url + '&method=minimal')
                    .done(function (response) {
                        let data = JSON.parse(response.data);

                        if (data.result) {
                            resolve();
                        } else {
                            reject();
                        }

                    }).fail(function (xhr) {
                    reject();
                });
            }
        }).then(function () {
            Sovmart.initButtonsMain();
            SovmartUI.loaderShow({
                container: page,
                wait: function (resolve, reject) {
                    let url = Sovmart.url + '&method=categories';

                    SovmartUtils.ajaxGet(url)
                        .done(function (json) {
                            json = JSON.parse(json.data);
                            let categories_items = json.data;
                            let items = {
                                dropdown: {
                                    label: SovmartLangs.category,
                                    icon: 'ri-down',
                                    icon_position: 'right',
                                    class: 'ri-btn ri-btn-default',
                                    events: []
                                },
                                items: []
                            };
                            let group = {
                                name: 'categories',
                                items: []
                            };

                            Sovmart.categories = [];
                            let parent_title = '';

                            for (let i = 0; i < categories_items.length; i++) {

                                Sovmart.categories.push(categories_items[i].attributes);

                                if (
                                    (i > 0) &&
                                    categories_items[i].attributes.level > categories_items[i - 1].attributes.level
                                ) {
                                    parent_title = categories_items[i - 1].attributes.title + '/';
                                }

                                if (
                                    (i > 0) &&
                                    categories_items[i].attributes.level < categories_items[i - 1].attributes.level
                                ) {
                                    parent_title = '';
                                }

                                items.items.push({
                                    'label': parent_title + '' + categories_items[i].attributes.title,
                                    'class': 'ri-btn ri-btn-default ri-btn-change-category',
                                    'data-type': 'category-' + categories_items[i].attributes.id,
                                    'events': [
                                        [
                                            'click',
                                            function (ev) {
                                                Sovmart.showCategory(categories_items[i].attributes.id);
                                            }
                                        ]
                                    ]
                                });
                            }

                            for (let k = 0; k < Sovmart.buttons_page_main.groups.length; k++) {

                                if (Sovmart.buttons_page_main.groups[k].name === 'main') {
                                    Sovmart.buttons_page_main.groups[k].items.push(items);
                                    break;
                                }

                            }

                            SovmartUI.showPage({buttons: Sovmart.buttons_page_main});

                            resolve();

                        }).fail(function (xhr) {
                        reject();
                    });
                }
            }).then(function () {

                if(SovmartConfig.sync) {
                    SovmartProject.sync({
                        done: function () {
                            Sovmart.checkUpdatedProjects();
                            Sovmart.showStart();
                        }
                    });
                } else {
                    Sovmart.showStart();
                    Sovmart.checkUpdatedProjects();
                }


                let header = SovmartUtils.createElement('div', {class: 'sovmart-flex'})

                header = header
                    .add('div', {class: 'sovmart-width-expand'}, SovmartUI.renderFormSearch())
                    .add('div', {class: 'sovmart-width-auto'},
                        (SovmartConfig.name !== '' && SovmartConfig.token !== '') ? SovmartUI.renderAuth() : SovmartUI.renderNoAuth()
            );

                SovmartUI.container_header.appendChild(header.build());
            });

        }).catch(function () {
            Sovmart.showForcedUpdate();
        });

    },

    reload: function () {
        window.location.reload();
    },

    showStart: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=startpage')
                    .done(function (response) {
                        let items = JSON.parse(response.data);
                        resolve(items.data.attributes);
                    }).fail(function (xhr) {
                    reject(xhr);
                });
            }
        }).then(items => {

            let ids = [];



            for (let k = 0; k < items.length; k++) {

                let grid_required = '';
                let grid_not_required = '';
                let projects_card_required = [];
                let projects_card_not_required = [];
                let ids_required = [];
                let accordeon = {};
                let group = {
                    label: items[k].title,
                    description: items[k].description,
                };

                if (items[k].items_required !== undefined) {
                    for (let c = 0; c < items[k].items_required.length; c++) {
                        projects_card_required.push(
                            SovmartUI.renderProjectCard(items[k].items_required[c])
                        );
                        ids.push(parseInt(items[k].items_required[c].id));
                        ids_required.push(parseInt(items[k].items_required[c].id))
                    }

                    for (let c = 0; c < items[k].items_not_required.length; c++) {
                        projects_card_not_required.push(
                            SovmartUI.renderProjectCard(items[k].items_not_required[c])
                        );
                        ids.push(parseInt(items[k].items_not_required[c].id));
                    }

                    grid_required = SovmartUI.renderProjectGrid({
                        items: projects_card_required,
                        trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                    });

                    if(items[k].items_not_required !== undefined && items[k].items_not_required.length > 0) {
                        accordeon.label = 'Показать состав ядра';
                        accordeon.label_close = 'Скрыть состав ядра';
                    }

                    group.groups = [
                        {
                            class: '',
                            accordeon: accordeon,
                            buttons: [{
                                    label: 'Установить ' + items[k].title,
                                    class: 'ri-btn ri-btn-primary',
                                    events: [
                                        [
                                            'click', function (ev) {
                                            let button_install = this;
                                            let subgroup = this.closest('.sovmart-group');
                                            let logs_id = this.getAttribute('data-connect-logs-id');
                                            let logs_container = SovmartUI.container.querySelector('.sovmart-logs[data-for-row="' + logs_id + '"]');
                                            logs_container.innerHTML = '';
                                            button_install.setAttribute('disabled', 'disabled');
                                            button_install.innerHTML = SovmartLangs.install_process;
                                            subgroup.classList.add('ri-area-disabled');
                                            SovmartProject.install({
                                                ids: ids_required,
                                                success: function (responses) {
                                                    let success = false;
                                                    let success_break = false;
                                                    let data = [];
                                                    let messages = [];
                                                    logs_container.append(SovmartUI.renderLogsClose());

                                                    for (let k = 0; k < responses.length; k++) {
                                                        data = JSON.parse(responses[k].data);

                                                        if (
                                                            data.messages !== undefined &&
                                                            data.messages !== null &&
                                                            data.messages.length > 0
                                                        ) {

                                                            for (let i = data.messages.length - 1; i >= 0; i--) {
                                                                messages.push(
                                                                    SovmartUtils.createElement(
                                                                        'div',
                                                                        {},
                                                                        '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>'
                                                                    ).build()
                                                                );
                                                            }
                                                        }

                                                        if (responses[k].success === true && !success_break) {
                                                            if (data.status === undefined || data.status === null || data.status === 'fail') {
                                                                success = false;
                                                                success_break = true;
                                                            } else {
                                                                success = true;
                                                            }
                                                        }

                                                    }


                                                    if (success) {

                                                        logs_container.append(
                                                            SovmartUtils.createElement(
                                                                'div',
                                                                {},
                                                                '<div class="alert alert-info">' + SovmartLangs.text_installed_meta + '</div>'
                                                            ).build()
                                                        );

                                                        logs_container.append(
                                                            SovmartUI.renderToggle({
                                                                label: 'Показать подробности установки',
                                                                label_close: 'Свернуть подробности установки',
                                                                label_class: 'ri-btn-default',
                                                                content: messages
                                                            })
                                                        );

                                                    } else {

                                                        logs_container.append(
                                                            SovmartUtils.createElement(
                                                                'div',
                                                                {},
                                                                '<div class="alert alert-danger">' + SovmartLangs.text_installed_meta_error + '</div>'
                                                            ).build()
                                                        );

                                                        for (let k = 0; k < messages.length; k++) {
                                                            logs_container.append(messages[k]);
                                                        }

                                                    }

                                                    Sovmart.checkUpdatedProjects(false);
                                                    button_install.innerHTML = SovmartLangs.install_meta;
                                                    button_install.removeAttribute('disabled');
                                                    subgroup.classList.remove('ri-area-disabled');
                                                },
                                                fail: function () {
                                                    button_install.innerHTML = SovmartLangs.install;
                                                    button_install.removeAttribute('disabled');
                                                    subgroup.classList.remove('ri-area-disabled');
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
                                }
                            ],
                            content: grid_required
                        }
                    ];

                    if(projects_card_not_required.length > 0)
                    {
                        grid_not_required = SovmartUI.renderProjectGrid({
                            items: projects_card_not_required,
                            trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                        });

                        group.groups.push({
                            label: SovmartLangs.group_other,
                            class: '',
                            content: grid_not_required
                        });

                    }
                }


                if (items[k].items !== undefined) {
                    projects_card_required = [];
                    let i = 1;
                    let max = 10;

                    if (window.matchMedia("(max-width: 2100px)").matches) {
                        max = 8;
                    }

                    if (
                        items[k].items === null ||
                        items[k].items === undefined
                    ) {
                        continue;
                    }

                    if (items[k].items.length === 0) {
                        continue;
                    }

                    for (let c = 0; c < items[k].items.length; c++) {

                        if (items[k].name === 'free' && c >= max) {
                            break;
                        }

                        if (items[k].name === 'paid' && c >= max) {
                            break;
                        }

                        projects_card_required.push(
                            SovmartUI.renderProjectCard(items[k].items[c])
                        );
                        ids.push(parseInt(items[k].items[c].id));
                    }

                    group.content = SovmartUI.renderProjectGrid({
                        items: projects_card_required,
                        trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                    });

                    if (items[k].name === 'free') {

                        group.actions = [
                            {
                                label: SovmartLangs.view_all,
                                class: 'ri-btn ri-btn-primary',
                                events: [
                                    [
                                        'click',
                                        function (event) {
                                            Sovmart.showProjectsFree();
                                        }
                                    ]
                                ]
                            }
                        ];

                    }

                    if (items[k].name === 'paid') {

                        group.actions = [
                            {
                                label: SovmartLangs.view_all,
                                class: 'ri-btn ri-btn-primary',
                                events: [
                                    [
                                        'click',
                                        function (event) {
                                            Sovmart.showProjectsPaid();
                                        }
                                    ]
                                ]
                            }
                        ];

                    }

                }

                page.appendChild(SovmartUI.renderGroup(group));

            }

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });


        });
    },

    showCriticalError: function (error) {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: [],
            page: page
        });

        let message = SovmartUtils.createElement('div')
            .add('div', {class: 'sovmart-margin-bottom-small'}, SovmartLangs.text_critical_error)
            .addChild('div', {class: 'sovmart-flex sovmart-flex-middle'})
            .add(
                'button',
                {
                    type: 'button',
                    class: 'ri-btn ri-btn-large ri-btn-default sovmart-margin-right-small',
                    events: [
                        [
                            'click',
                            function (ev) {
                                let input = SovmartUtils.createElement('input');
                                input.value = error;
                                input.select();
                                input.setSelectionRange(0, 99999); // For mobile devices

                                navigator.clipboard.writeText(input.value);

                                SovmartUtils.createAlert(SovmartLangs.text_copied)
                            }
                        ]
                    ]
                },
                SovmartLangs.copy
            )
            .add('button', {
                    type: 'button',
                    class: 'ri-btn ri-btn-large ri-btn-default',
                    events: [
                        [
                            'click',
                            function (ev) {
                                SovmartUtils.openInNewTab(Sovmart.api + '/contacts')
                            }
                        ]
                    ]
                },
                SovmartLangs.support)
            .getParent();

        let forced_update = SovmartUtils.createElement('div', {class: 'sovmart-flex sovmart-flex-middle sovmart-flex-center'})
            .add('div', {class: 'sovmart-width-1-2'}, SovmartUI.renderAlert({message: message.build()}));

        page.appendChild(forced_update.build())
    },

    showForcedUpdate: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: [],
            page: page
        });

        let message = SovmartUtils.createElement('div')
            .add('div', {class: 'sovmart-margin-bottom-small'}, SovmartLangs.text_updated_force)
            .addChild('div', {class: 'sovmart-flex sovmart-flex-middle'})
            .add(
                'button',
                {
                    type: 'button',
                    class: 'ri-btn ri-btn-large ri-btn-default sovmart-margin-right-small',
                    events: [
                        [
                            'click',
                            function (ev) {
                                let button = this;

                                button.innerHTML = SovmartLangs.install_process;
                                button.setAttribute('disabled', 'disabled');

                                SovmartProject.install({
                                    ids: [Sovmart.installer_service_id],
                                    success: function (responses) {
                                        location.reload();
                                    },
                                    fail: function (responses) {
                                        alert(SovmartLangs.text_updated_force_error);
                                        button.innerHTML = SovmartLangs.update;
                                        button.removeAttribute('disabled');
                                    }
                                });
                            }
                        ]
                    ]
                },
                SovmartLangs.update
            )
            .add('button', {
                    type: 'button',
                    class: 'ri-btn ri-btn-large ri-btn-default',
                    events: [
                        [
                            'click',
                            function (ev) {
                                SovmartUtils.openInNewTab(Sovmart.api + '/contacts')
                            }
                        ]
                    ]
                },
                SovmartLangs.support)
            .getParent();

        let forced_update = SovmartUtils.createElement('div', {class: 'sovmart-flex sovmart-flex-middle sovmart-flex-center'})
            .add('div', {class: 'sovmart-width-1-2'}, SovmartUI.renderAlert({message: message.build()}));

        page.appendChild(forced_update.build())
    },

    showUpdates: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=checkupdates')
                    .done(function (response) {
                        let data = JSON.parse(response.data);

                        resolve(data);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then(data => {

            if (data.items.length === 0) {
                page.appendChild(SovmartUI.renderGroup({
                    label: SovmartLangs.updated,
                    content: SovmartUI.renderAlert({message: SovmartLangs.text_updated_no})
                }));

                return;
            }

            let grid = '';
            let projects_card = [];
            let ids = [];

            for (let k = 0; k < data.items.length; k++) {
                projects_card.push(
                    SovmartUI.renderProjectCard(data.items[k])
                );
                ids.push(parseInt(data.items[k].project_id));
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: SovmartLangs.updated,
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

        });
    },

    showInstalled: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=installedlist')
                    .done(function (response) {
                        let items = response.data;
                        resolve(items);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then(items => {

            if (items.length === 0) {
                page.appendChild(SovmartUI.renderGroup({
                    label: SovmartLangs.installed,
                    content: SovmartUI.renderAlert({message: SovmartLangs.text_installed_no})
                }));

                return;
            }


            let grid = '';
            let projects_card = [];
            let ids = [];

            for (let k = 0; k < items.length; k++) {
                projects_card.push(
                    SovmartUI.renderProjectCard(items[k])
                );
                ids.push(parseInt(items[k].project_id));
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: SovmartLangs.installed,
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

        });
    },

    showProject: function (id) {
        let page = SovmartUI.renderPage();
        let group_actions = {
            name: 'actions',
            items: []
        };
        let group_info = {
            name: 'info',
            items: []
        };
        let buttons_page_project = {
            groups: [
                {
                    name: 'back',
                    items: [
                        {
                            //label: 'Назад',
                            label: SovmartLangs.home,
                            icon: 'ri-home',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        Sovmart.showStart();
                                    }
                                ]
                            ]
                        }
                    ]
                }
            ]
        };

        SovmartUI.showPage({
            buttons: buttons_page_project,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=project&project_id=' + id)
                    .done(function (response) {
                        let project = JSON.parse(response.data);
                        resolve(project.data);
                    }).fail(function (xhr) {
                    reject(xhr);
                });
            }
        }).then(project => {

            let header = SovmartUtils.createElement('div', {class: 'sovmart-width-1-2@l sovmart-margin-bottom'}),
                body = SovmartUtils.createElement('div', {class: 'sovmart-width-1-2@l sovmart-project-page'}),
                color = '#eee',
                docs = '',
                support = '',
                paid = 'free';

            if (project.attributes.download_type === 'paid') {
                paid = 'paid';
            }

            // проверяем наличие поддержки у расширения
            if (
                project.attributes.urls.support !== undefined &&
                project.attributes.urls.support !== false &&
                project.attributes.urls.support !== ''
            ) {
                support = project.attributes.urls.support;
            }

            // проверяем наличии документации у расширения
            if (
                project.attributes.urls.documentation !== undefined &&
                project.attributes.urls.documentation !== false &&
                project.attributes.urls.documentation !== ''
            ) {
                docs = project.attributes.urls.documentation;
            }

            if (
                project.attributes.documentation !== undefined &&
                project.attributes.documentation !== false &&
                project.attributes.documentation !== ''
            ) {
                docs = Sovmart.api + project.attributes.documentation;
            }

            if (project.attributes.params !== undefined) {
                if (
                    project.attributes.params.attrs_color !== undefined &&
                    project.attributes.params.attrs_color !== ''
                ) {
                    color = project.attributes.params.attrs_color;
                }
            }

            header = header.add('div', {class: 'sovmart-logs'});

            // проверяем наличии галереи у расширения и генерируем DOM, если она есть
            if (project.attributes.gallery.length > 0) {
                header = header.addChild('div', {
                    'class': 'sovmart-project-page_gallery-images',
                    'data-active': 1
                })
                    .add('div', {
                        'class': 'sovmart-project-page_gallery-images-background',
                        'style': 'background-color: ' + color
                    });
                for (let i = 0; i < project.attributes.gallery.length; i++) {
                    header = header.addChild('div', {
                        'class': 'sovmart-project-page_gallery-images-element',
                        'style': i === 0 ? 'display:block' : 'display:none'
                    })
                        .add('img', {
                            'alt': project.attributes.gallery[i].text,
                            'src': Sovmart.api + '/' + project.attributes.gallery[i].src
                        })
                        .add('div', {'class': 'sovmart-project-page_gallery-images-element_caption'}, project.attributes.gallery[i].text)
                        .getParent();
                }

                header = header.add('button', {
                    'class': 'sovmart-project-page_gallery-images-prev', 'events': [
                        [
                            'click', function (ev) {
                            let i,
                                slideshow = this.closest(".sovmart-project-page_gallery-images"),
                                slides = slideshow.querySelectorAll('.sovmart-project-page_gallery-images-element'),
                                active = parseInt(slideshow.getAttribute('data-active')) - 1;

                            if (active > slides.length) {
                                active = 1;
                            }

                            if (active < 1) {
                                active = slides.length;
                            }

                            for (i = 0; i < slides.length; i++) {
                                slides[i].style.display = "none";
                            }

                            slides[active - 1].style.display = "block";
                            slideshow.setAttribute('data-active', active);
                        }
                        ]
                    ]
                }, '❮');

                header = header.add('button', {
                    'class': 'sovmart-project-page_gallery-images-next', 'events': [
                        [
                            'click', function (ev) {
                            let i,
                                slideshow = this.closest(".sovmart-project-page_gallery-images"),
                                slides = slideshow.querySelectorAll('.sovmart-project-page_gallery-images-element'),
                                active = parseInt(slideshow.getAttribute('data-active')) + 1;

                            if (active > slides.length) {
                                active = 1;
                            }

                            if (active < 1) {
                                active = slides.length;
                            }

                            for (i = 0; i < slides.length; i++) {
                                slides[i].style.display = "none";
                            }

                            slides[active - 1].style.display = "block";
                            slideshow.setAttribute('data-active', active);
                        }
                        ]
                    ]
                }, '❯');
                header = header.getParent();
            } else {
                if (
                    project.attributes.images !== undefined &&
                    project.attributes.images.cover !== undefined &&
                    project.attributes.images.cover !== false
                ) {
                    header = header.addChild('div', {
                        'class': 'sovmart-project-page_gallery-images',
                        'data-active': 1
                    })
                        .add('div', {
                            'class': 'sovmart-project-page_gallery-images-background',
                            'style': 'background-color: ' + color
                        });
                    header = header.addChild('div', {
                        'class': 'sovmart-project-page_gallery-images-element',
                        'style': 'display:block'
                    })
                        .add('img', {
                            'src': Sovmart.api + '/' + project.attributes.images.cover
                        })
                        .getParent()
                        .getParent();
                }

            }

            body = body.add('h2', {'class': 'sovmart-project-page_gallery-header'}, project.attributes.title);

            group_actions.items.push({
                label: SovmartLangs.install,
                icon: 'ri-download',
                class: 'ri-btn ri-btn-default ri-btn-success ri-btn-install',
                disabled: 'disabled',
                events: [
                    [
                        'click',
                        function (ev) {
                            let button_install = this;
                            let button_delete = SovmartUI.getContainerToolbar().querySelector('.ri-btn-delete');
                            let logs_container = SovmartUI.getPage().querySelector('.sovmart-logs');

                            logs_container.innerHTML = '';

                            button_install.setAttribute('disabled', 'disabled');
                            button_install.querySelector('span').innerHTML = SovmartLangs.install_process;

                            SovmartProject.install({
                                ids: [id],
                                success: function (responses) {
                                    let success = false;
                                    let data = JSON.parse(responses[0].data);

                                    logs_container.append(SovmartUI.renderLogsClose());

                                    if (data.messages !== undefined && data.messages !== null) {
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
                                        button_install.querySelector('span').innerHTML = SovmartLangs.reinstall;

                                        if (
                                            button_delete !== undefined &&
                                            button_delete !== null
                                        ) {
                                            button_delete.classList.remove('ri-hidden');
                                            button_delete.removeAttribute('disabled');
                                        }

                                        Sovmart.checkUpdatedProjects(false, false);
                                    } else {
                                        button_install.querySelector('span').innerHTML = SovmartLangs.install;
                                    }

                                    button_install.removeAttribute('disabled');
                                },
                                fail: function (responses) {
                                    button_install.querySelector('span').innerHTML = SovmartLangs.install;
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
                ],
            });

            group_actions.items.push({
                label: SovmartLangs.delete,
                icon: 'ri-trash',
                class: 'ri-btn ri-btn-default ri-btn-danger ri-btn-delete ri-hidden',
                events: [
                    [
                        'click',
                        function (ev) {


                            let button_install = SovmartUI.getContainerToolbar().querySelector('.ri-btn-install');
                            let button_delete = this;
                            let logs_container = SovmartUI.getPage().querySelector('.sovmart-logs');

                            logs_container.innerHTML = '';

                            button_delete.setAttribute('disabled', 'disabled');
                            button_delete.querySelector('span').innerHTML = SovmartLangs.delete_process;

                            SovmartProject.delete({
                                id: [id],
                                success: function (response, project_delete_id) {
                                    let success = false;
                                    let data = response;

                                    logs_container.append(SovmartUI.renderLogsClose());

                                    if (data.messages !== undefined && data.messages !== null) {
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

                                    button_delete.innerHTML = SovmartLangs.delete;

                                    if (success) {
                                        button_delete.classList.add('ri-hidden');

                                        if (
                                            button_install !== undefined &&
                                            button_install !== null
                                        ) {
                                            button_install.innerHTML = SovmartLangs.install;
                                        }

                                        Sovmart.checkUpdatedProjects(false, false);
                                    }

                                    button_delete.removeAttribute('disabled');
                                },
                                fail: function () {
                                    button_delete.innerHTML = SovmartLangs.delete;
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
            });

            if (
                docs !== undefined &&
                docs !== false &&
                docs !== ''
            ) {
                group_info.items.push({
                    label: SovmartLangs.docs,
                    icon: 'ri-link',
                    class: 'ri-btn ri-btn-default',
                    events: [
                        [
                            'click',
                            function (event) {
                                SovmartUtils.openInNewTab(docs);
                            }
                        ]
                    ]
                });
            }

            if (
                support !== undefined &&
                support !== false &&
                support !== ''
            ) {
                group_info.items.push({
                    label: SovmartLangs.support,
                    class: 'ri-btn ri-btn-default',
                    icon: 'ri-link',
                    events: [
                        [
                            'click',
                            function (event) {
                                SovmartUtils.openInNewTab(support);
                            }
                        ]
                    ]
                });
            }

            body.add('div', {'class': 'sovmart-project-page_description-header'}, SovmartLangs.description);

            if (
                project.fulltext !== undefined &&
                project.fulltext !== ''
            ) {
                body = body.add('div', {'class': 'sovmart-project-page_description-text'}, project.fulltext);
            } else {
                if (project.introtext !== undefined && project.introtext !== '') {
                    body = body.add('div', {'class': 'sovmart-project-page_description-text'}, project.introtext);
                } else {
                    body = body.add('div', {'class': 'sovmart-project-page_description-text'}, SovmartLangs.description_no);
                }
            }

            header = header.build();
            body = body.build();

            buttons_page_project.groups.push(group_actions, group_info);

            let project_container = SovmartUtils.createElement('div', {
                'data-project': project.id,
                'data-paid': paid
            }, [header, body]).build();

            SovmartUI.showPage({
                buttons: buttons_page_project,
                page: project_container
            });

            SovmartProject.checkInstall({
                ids: [parseInt(project.id)],
                done: Sovmart.checkInstallProjectPage
            });

        });

    },

    showCategory: function (id, title) {
        let self = this;
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=projects&category_id=' + id)
                    .done(function (response) {
                        let data = JSON.parse(response.data);
                        resolve(data);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then(data => {
            let grid = '';
            let projects_card = [];
            let categories_list = [];
            let ids = [];
            let i = Sovmart.categories.length - 1;
            let category_level = -1;

            while(i >= 0)
            {
                if(Sovmart.categories[i].id === id) {
                    category_level = Sovmart.categories[i].level;
                } else {
                    if(
                        category_level < 0 ||
                        Sovmart.categories[i].level === category_level
                    ) {
                        i--;
                        continue;
                    }
                }

                if(Sovmart.categories[i].level >= 1) {
                    categories_list.unshift(Sovmart.categories[i].title);
                }

                if(Sovmart.categories[i].level <= 1) {
                    break;
                }

                i--;
            }

            for (let k = 0; k < data.data.length; k++) {
                projects_card.push(
                    SovmartUI.renderProjectCard(data.data[k].attributes)
                );
                ids.push(data.data[k].attributes.id);
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: categories_list.join(' / '),
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

            if(
                data.links.next !== undefined &&
                data.links.next !== null
            ) {
                self.showPageNext(data.links.next);
            }

        });
    },

    showProjectsFree: function () {
        let self = this;
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=projectsfree')
                    .done(function (response) {
                        let items = JSON.parse(response.data);
                        resolve(items);
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
                ids.push(parseInt(items.data[k].attributes.id));
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: SovmartLangs.group_free,
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

            if(
                items.links.next !== undefined &&
                items.links.next !== null
            ) {
                self.showPageNext(items.links.next);
            }
        });
    },

    showPageNext: function (url) {
        let self = this;
        let page = SovmartUI.getPage();
        let content = page.querySelector('.sovmart-group-content');

        if(
            content === null ||
            content === undefined
        )
        {
            return;
        }

        // забираем первый див, в него будет вставлять
        content = content.children[0];

        let button = SovmartUtils.createElement('div', {class: 'sovmart-flex sovmart-flex-center sovmart-margin'})
            .add('button', {
                type: 'button',
                class: 'ri-btn ri-btn-primary ri-btn-large button-load-more',
                events: [
                    [
                        'click',
                        function (event) {


                            let button_self = this;
                            this.setAttribute('disabled', 'disabled');

                            SovmartUtils.ajaxGet(url)
                            .done(function (response) {
                                let items = {};

                                if(typeof response === 'string') {
                                    items = JSON.parse(response);
                                } else {
                                    items = response;
                                }

                                let grid = '';
                                let projects_card = [];
                                let ids = [];

                                for (let k = 0; k < items.data.length; k++) {
                                    projects_card.push(
                                        SovmartUI.renderProjectCard(items.data[k].attributes)
                                    );
                                    ids.push(parseInt(items.data[k].attributes.id));
                                }

                                grid = SovmartUI.renderProjectGrid({
                                    items: projects_card,
                                    trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                                });

                                button_self.parentElement.remove();
                                let collections = Array.from(grid.children);

                                for(let i=0;i<collections.length;i++) {
                                    content.appendChild(collections[i]);
                                }

                                SovmartProject.checkInstall({
                                    ids: ids,
                                    done: Sovmart.checkInstallProjectCard
                                });

                                if(
                                    items.links.next !== undefined &&
                                    items.links.next !== null
                                ) {
                                    self.showPageNext(items.links.next);
                                }

                            })
                            .fail(function (xhr) {
                                button_self.removeAttribute('disabled');
                            });
                        }
                    ]
                ]
            }, 'Загрузить еще');

        page.appendChild(button.build());
    },

    showProjectsPaid: function () {
        let page = SovmartUI.renderPage();
        let self = this;

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=projectspaid')
                    .done(function (response) {
                        let items = JSON.parse(response.data);
                        resolve(items);
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
                ids.push(parseInt(items.data[k].attributes.id));
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: SovmartLangs.group_paid,
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

            if(
                items.links.next !== undefined &&
                items.links.next !== null
            ) {
                self.showPageNext(items.links.next);
            }

        });
    },

    initButtonsMain: function () {
        let self = this;
        this.buttons_page_main = {
            groups: [
                {
                    name: 'main',
                    items: [
                        {
                            name: 'home',
                            icon: 'ri-home',
                            label: SovmartLangs.home,
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        Sovmart.showStart();
                                    }
                                ]
                            ]
                        }
                    ]
                },
                {
                    name: 'utils',
                    items: [
                        {
                            name: 'updated',
                            label: SovmartLangs.updated,
                            class: 'ri-btn ri-btn-default ri-btn-check-update',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        Sovmart.showUpdates();
                                    }
                                ]
                            ]
                        },
                        {
                            name: 'installed',
                            icon: 'ri-download',
                            label: SovmartLangs.installed,
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        Sovmart.showInstalled();
                                    }
                                ]
                            ]
                        },
                        {
                            name: 'sync',
                            icon: 'ri-sync',
                            label: SovmartLangs.sync,
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        SovmartProject.sync({
                                            done: function () {
                                                Sovmart.checkUpdatedProjects();
                                                Sovmart.showStart();
                                            }
                                        });
                                    }
                                ]
                            ]
                        }
                    ]
                },
                {
                    name: 'info',
                    items: [
                        {
                            name: 'support',
                            icon: 'ri-support',
                            label: SovmartLangs.support,
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        SovmartUtils.openInNewTab(Sovmart.api + '/contacts');
                                    }
                                ]
                            ]
                        }
                    ]
                }
            ]
        };
    },

    checkUpdatedProjects: function (show_alert, show_toolbar) {

        if (show_alert === null || show_alert === undefined) {
            show_alert = true;
        }

        if (show_toolbar === null || show_toolbar === undefined) {
            show_toolbar = true;
        }

        SovmartProject.checkUpdate({
            done: function (items) {
                let class_list = '';

                if (parseInt(items.count) > 0) {
                    if (show_alert) {
                        SovmartUtils.createAlert(SovmartLangs.text_updated_new, 'info', 5000);
                    }
                } else {
                    class_list = 'empty';
                }

                for (let k = 0; k < Sovmart.buttons_page_main.groups.length; k++) {
                    for (let c = 0; c < Sovmart.buttons_page_main.groups[k].items.length; c++) {
                        for (let j = 0; j < Sovmart.buttons_page_main.groups[k].items.length; j++) {
                            if (Sovmart.buttons_page_main.groups[k].items[j].name === 'updated') {
                                Sovmart.buttons_page_main.groups[k].items[j].label = '<span class="' + class_list + '">' + items.count + '</span> ' + SovmartLangs.updated
                            }
                        }
                    }
                }

                if (show_toolbar) {
                    SovmartUI.showPage({buttons: Sovmart.buttons_page_main});
                }

            }
        })
    },

    checkInstallProjectCard: function (find_ids, ids, updates) {

        for (let k = 0; k < ids.length; k++) {
            let cards = SovmartUI.container.querySelectorAll('[data-project="' + ids[k] + '"]');

            if (cards.length === 0) {
                continue;
            }

            for (let i = 0; i < cards.length; i++) {
                let paid = cards[i].getAttribute('data-paid');

                cards[i].querySelector('.ri-btn-install').removeAttribute('disabled');

                if (find_ids.indexOf(parseInt(ids[k])) !== -1) {
                    cards[i].querySelector('.ri-btn-install').innerHTML = SovmartLangs.reinstall;
                    cards[i].querySelector('.ri-btn-delete').classList.remove('ri-hidden');
                }
            }

        }

        if (updates.count > 0) {
            for (let j = 0; j < updates.items.length; j++) {
                let cards = SovmartUI.container.querySelectorAll('[data-project="' + updates.items[j].project_id + '"]');

                if (cards.length === 0) {
                    continue;
                }

                for (let i = 0; i < cards.length; i++) {
                    cards[i].querySelector('.ri-btn-install').innerHTML = SovmartLangs.update;
                    cards[i].querySelector('.sovmart-project-card-version').classList.remove('ri-hidden');
                    cards[i].querySelector('.sovmart-project-card-version').querySelector('.value-last').innerHTML = updates.items[j].version_last;
                    let version = cards[i].querySelector('.sovmart-project-card-version').querySelector('.value').innerHTML;

                    if (version === updates.items[j].version_last) {
                        cards[i].querySelector('.sovmart-project-card-version').querySelector('.value').innerHTML = '';
                    }

                    if (
                        (version !== '' && updates.items[j].version_last !== '') &&
                        (version !== updates.items[j].version_last)
                    ) {
                        cards[i].querySelector('.sovmart-project-card-version').querySelector('.value-arrow').classList.remove('ri-hidden');
                    }

                    cards[i].querySelector('.sovmart-project-card-version').querySelector('.value-last').classList.remove('ri-hidden');
                }

            }
        }

    },

    checkInstallProjectPage: function (find_ids, ids, updates) {

        for (let k = 0; k < ids.length; k++) {
            let project = SovmartUI.container.querySelector('[data-project="' + ids[k] + '"]');

            if (project === undefined || project === null) {
                continue;
            }

            let paid = project.getAttribute('data-paid');

            SovmartUI.container.querySelector('.ri-btn-install').removeAttribute('disabled');

            if (find_ids.indexOf(parseInt(ids[k])) !== -1) {
                SovmartUI.container.querySelector('.ri-btn-install').querySelector('span').innerHTML = SovmartLangs.reinstall;
                SovmartUI.container.querySelector('.ri-btn-delete').classList.remove('ri-hidden');
            }
        }

        if (updates.count > 0) {
            for (let j = 0; j < updates.items.length; j++) {
                let project = SovmartUI.container.querySelector('[data-project="' + updates.items[j].project_id + '"]');

                if (project === undefined || project === null) {
                    continue;
                }

                SovmartUI.container.querySelector('.ri-btn-install').innerHTML = SovmartLangs.update;

            }
        }

    },

    triggerGridRowEndForCard: function (items, grid_row_id) {
        for (let i = 0; i < items.length; i++) {
            let button_install = items[i].querySelector('.ri-btn-install');
            let button_delete = items[i].querySelector('.ri-btn-delete');

            if (button_install !== undefined) {
                button_install.setAttribute('data-connect-logs-id', grid_row_id);
            }

            if (button_delete !== undefined) {
                button_delete.setAttribute('data-connect-logs-id', grid_row_id);
            }
        }
    }

}
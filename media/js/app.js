window.Sovmart = {

    api: 'https://sovmart.ru',
    url: 'index.php?option=com_ajax&plugin=radicalinstaller&group=installer&format=json',
    assets: '/media/PLG_INSTALLER_SOVMART/',
    buttons_page_main: {},
    installer_service_id: 24,


    init: function () {
        SovmartUI.container = document.querySelector('#radicalinstaller-container');
        SovmartUI.container_form_key = SovmartUI.container.querySelector('.radicalinstaller-form-key');
        SovmartUI.container_toolbar = SovmartUI.container.querySelector('.radicalinstaller-toolbar');
        SovmartUI.container_page = SovmartUI.container.querySelector('.radicalinstaller-page');

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

                        if(data.result) {
                            resolve();
                        } else {
                            reject();
                        }

                    }).fail(function (xhr) {
                    reject();
                });
            }
        }).then( function () {
            Sovmart.initButtonsMain();
            Sovmart.showStart();
            Sovmart.loadCategories();
            Sovmart.checkUpdatedProjects();
            SovmartUI.container_form_key.appendChild(
                SovmartUI.renderFormKey()
            );
        }).catch(function () {
            Sovmart.showForcedUpdate();
        });

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

                SovmartUtils.ajaxGet(Sovmart.url + '&method=groupsStartPage')
                    .done(function (response) {
                        let items = JSON.parse(response.data);
                        resolve(items);
                    }).fail(function (xhr) {
                    reject(xhr);
                });
            }
        }).then( items => {

            let ids = [];

            for(let k=0;k<items.length;k++) {

                let grid_required = '';
                let grid_not_required = '';
                let projects_card_required = [];
                let projects_card_not_required = [];
                let ids_required = [];
                let group = {
                    label: items[k].title,
                };

                if(items[k].items_required !== undefined) {
                    for(let c=0;c<items[k].items_required.length;c++) {
                        projects_card_required.push(
                            SovmartUI.renderProjectCard(items[k].items_required[c])
                        );
                        ids.push(parseInt(items[k].items_required[c].id));
                        ids_required.push(parseInt(items[k].items_required[c].id))
                    }

                    for(let c=0;c<items[k].items_not_required.length;c++) {
                        projects_card_not_required.push(
                            SovmartUI.renderProjectCard(items[k].items_not_required[c])
                        );
                        ids.push(parseInt(items[k].items_not_required[c].id));
                    }

                    grid_required = SovmartUI.renderProjectGrid({
                        items: projects_card_required,
                        trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                    });

                    grid_not_required = SovmartUI.renderProjectGrid({
                        items: projects_card_not_required,
                        trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                    });

                    if(items[k].name === 'meta')
                    {
                        group.buttons = [
                            {
                                label: SovmartLangs.install_meta,
                                class: 'ri-btn ri-btn-primary',
                                events: [
                                    [
                                        'click', function(ev) {
                                            let button_install = this;
                                            let subgroup = this.closest('.radicalinstaller-group');
                                            let logs_id = this.getAttribute('data-connect-logs-id');
                                            let logs_container = SovmartUI.container.querySelector('.radicalinstaller-logs[data-for-row="' + logs_id + '"]');
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

                                                for (let k=0;k<responses.length;k++) {
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


                                                if(success) {

                                                    logs_container.append(
                                                        SovmartUtils.createElement(
                                                            'div',
                                                            {},
                                                            '<div class="alert alert-info">' + SovmartLangs.text_installed_meta + '</div>'
                                                        ).build()
                                                    );

                                                    logs_container.append(
                                                        SovmartUI.renderAccordeon({
                                                            items: [
                                                                {
                                                                    label: 'Подробности установки',
                                                                    content: messages
                                                                }
                                                            ]
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

                                                    for (let k=0;k<messages.length;k++) {
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
                        ];
                    }

                    group.groups = [
                        {
                            label: SovmartLangs.group_main,
                            class: 'radicalinstaller-background-muted',
                            content: grid_required
                        },
                        {
                            label: SovmartLangs.group_other,
                            class: '',
                            content: grid_not_required
                        }
                    ];

                }


                if(items[k].items !== undefined) {
                    projects_card_required = [];
                    let i = 1;
                    let max = 6;

                    if(
                        items[k].items.items === null ||
                        items[k].items.items === undefined
                    ) {
                        continue;
                    }

                    if(items[k].items.items.length === 0) {
                        continue;
                    }

                    for(let c=0;c<items[k].items.items.length;c++) {

                        if(items[k].name === 'free' && c >= max) {
                            break;
                        }

                        projects_card_required.push(
                            SovmartUI.renderProjectCard(items[k].items.items[c])
                        );
                        ids.push(parseInt(items[k].items.items[c].id));
                    }

                    group.content = SovmartUI.renderProjectGrid({
                        items: projects_card_required,
                        trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
                    });

                    if(items[k].name === 'free') {

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

                }

                page.appendChild(SovmartUI.renderGroup(group));

            }

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

        });
    },


    showForcedUpdate: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: [],
            page: page
        });

        let message = SovmartUtils.createElement('div')
            .add('div', {class: 'radicalinstaller-margin-bottom-small'}, SovmartLangs.text_updated_force)
            .addChild('div', {class: 'radicalinstaller-flex radicalinstaller-flex-middle'})
                .add(
                    'button',
                    {
                        type: 'button',
                        class: 'ri-btn ri-btn-large ri-btn-default radicalinstaller-margin-right-small',
                        events: [
                            [
                                'click',
                                function (ev) {
                                    let button = this;

                                    button.innerHTML = SovmartLangs.install_process;
                                    button.setAttribute('disabled', 'disabled');

                                    SovmartProject.install({
                                        ids: [Sovmart.installer_service_id],
                                        success: function(responses) {
                                            location.reload();
                                        },
                                        fail: function(responses) {
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
                                    SovmartUtils.openInNewTab(Sovmart.api + '/kontakty')
                                }
                            ]
                        ]
                    },
                    SovmartLangs.support)
            .getParent();

        let forced_update = SovmartUtils.createElement('div', {class: 'radicalinstaller-flex radicalinstaller-flex-middle radicalinstaller-flex-center'})
            .add('div', {class: 'radicalinstaller-width-1-2'}, SovmartUI.renderAlert({message: message.build()}));

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

                SovmartUtils.ajaxGet(Sovmart.url + '&method=checkUpdates')
                    .done(function (response) {
                        let data = JSON.parse(response.data);

                        resolve(data);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then( data => {

            if(data.items.length === 0) {
                page.appendChild(SovmartUI.renderGroup({
                    label: SovmartLangs.updated,
                    content: SovmartUI.renderAlert({message: SovmartLangs.text_updated_no})
                }));

                return;
            }

            let grid = '';
            let projects_card = [];
            let ids = [];

            for(let k=0;k<data.items.length;k++) {
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

                SovmartUtils.ajaxGet(Sovmart.url + '&method=installedList')
                    .done(function (response) {
                        let items = response.data[0];
                        resolve(items);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then( items => {

            if(items.length === 0) {
                page.appendChild(SovmartUI.renderGroup({
                    label: SovmartLangs.installed,
                    content: SovmartUI.renderAlert({message: SovmartLangs.text_installed_no})
                }));

                return;
            }


            let grid = '';
            let projects_card = [];
            let ids = [];

            for(let k=0;k<items.length;k++) {
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
                                    function(event) {
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
                        resolve(project);
                    }).fail(function (xhr) {
                    reject(xhr);
                });
            }
        }).then(project => {

            let header = SovmartUtils.createElement('div', {class: 'radicalinstaller-width-1-2@l radicalinstaller-margin-bottom'}),
                body = SovmartUtils.createElement('div', {class: 'radicalinstaller-width-1-2@l radicalinstaller-project-page'}),
                color = '#eee',
                docs = '',
                support = '',
                paid = 'free';

            if(project.download_type === 'paid') {
                paid = 'paid';
            }

            // проверяем наличие поддержки у расширения
            if (
                project.urls.support !== undefined &&
                project.urls.support !== false &&
                project.urls.support !== ''
            ) {
                support = project.urls.support;
            }

            // проверяем наличии документации у расширения
            if (
                project.urls.documentation !== undefined &&
                project.urls.documentation !== false &&
                project.urls.documentation !== ''
            ) {
                docs = project.urls.documentation;
            }

            if (
                project.documentation !== undefined &&
                project.documentation !== false &&
                project.documentation !== ''
            ) {
                docs = Sovmart.api + project.documentation;
            }

            if (project.params !== undefined) {
                if (
                    project.params.attrs_color !== undefined &&
                    project.params.attrs_color !== ''
                ) {
                    color = project.params.attrs_color;
                }
            }

            header = header.add('div', {class: 'radicalinstaller-logs'});

            // проверяем наличии галереи у расширения и генерируем DOM, если она есть
            if (project.gallery.length > 0) {
                header = header.addChild('div', {'class': 'radicalinstaller-project-page_gallery-images', 'data-active': 1})
                    .add('div', {
                        'class': 'radicalinstaller-project-page_gallery-images-background',
                        'style': 'background-color: ' + color
                    });
                for (let i=0;i<item.gallery.length;i++) {
                    header = header.addChild('div', {
                        'class': 'radicalinstaller-project-page_gallery-images-element',
                        'style': i === 0 ? 'display:block' : 'display:none'
                    })
                        .add('img', {
                            'alt': project.gallery[i].text,
                            'src': self.api + '/' + project.gallery[i].src
                        })
                        .add('div', {'class': 'radicalinstaller-project-page_gallery-images-element_caption'}, project.gallery[i].text)
                        .getParent();
                }

                header = header.add('button', {
                    'class': 'radicalinstaller-project-page_gallery-images-prev', 'events': [
                        [
                            'click', function (ev) {
                            let i,
                                slideshow = this.closest(".radicalinstaller-project-page_gallery-images"),
                                slides = slideshow.querySelectorAll('.radicalinstaller-project-page_gallery-images-element'),
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
                    'class': 'radicalinstaller-project-page_gallery-images-next', 'events': [
                        [
                            'click', function (ev) {
                            let i,
                                slideshow = this.closest(".radicalinstaller-project-page_gallery-images"),
                                slides = slideshow.querySelectorAll('.radicalinstaller-project-page_gallery-images-element'),
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
                    project.images !== undefined &&
                    project.images.cover !== undefined &&
                    project.images.cover !== false
                ) {
                    header = header.addChild('div', {'class': 'radicalinstaller-project-page_gallery-images', 'data-active': 1})
                        .add('div', {
                            'class': 'radicalinstaller-project-page_gallery-images-background',
                            'style': 'background-color: ' + color
                        });
                    header = header.addChild('div', {
                        'class': 'radicalinstaller-project-page_gallery-images-element',
                        'style': 'display:block'
                    })
                        .add('img', {
                            'src': Sovmart.api + '/' + project.images.cover
                        })
                        .getParent()
                        .getParent();
                }

            }

            body = body.add('h2', {'class': 'radicalinstaller-project-page_gallery-header'}, project.title);
            let check_install = false;

            if (project.download_type === 'free') {
                check_install = true;
            }

            if (project.download_type === 'paid') {
                if (SovmartConfig.key !== '') {
                    check_install = true;
                }
            }

            if (check_install) {
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
                                let logs_container = SovmartUI.getContainerPage().querySelector('.radicalinstaller-logs');

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

                                        if(success) {
                                            button_install.querySelector('span').innerHTML = SovmartLangs.reinstall;

                                            if(
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
                                    fail: function(responses) {
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
            } else {
                group_actions.items.push({
                    label: SovmartLangs.need_key,
                    icon: 'ri-link',
                    class: 'ri-btn ri-btn-default ri-btn-success',
                    events: [
                        [
                            'click',
                            function (ev) {
                                SovmartUtils.openInNewTab(Sovmart.api + project.link);
                                ev.preventDefault();
                                return false;
                            }
                        ]
                    ],
                });
            }

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
                            let logs_container = SovmartUI.getContainerPage().querySelector('.radicalinstaller-logs');

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

                                    if(success) {
                                        button_delete.classList.add('ri-hidden');

                                        if(
                                            button_install !== undefined &&
                                            button_install !== null
                                        ) {
                                            button_install.innerHTML = SovmartLangs.install;
                                        }

                                        Sovmart.checkUpdatedProjects(false, false);
                                    }

                                    button_delete.removeAttribute('disabled');
                                },
                                fail: function() {
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
                            function(event) {
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
                            function(event) {
                                SovmartUtils.openInNewTab(support);
                            }
                        ]
                    ]
                });
            }

            body.add('div', {'class': 'radicalinstaller-project-page_description-header'}, SovmartLangs.description);

            if (
                project.fulltext !== undefined &&
                project.fulltext !== ''
            ) {
                body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, project.fulltext);
            } else {
                if(project.introtext !== undefined && project.introtext !== '') {
                    body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, project.introtext);
                } else {
                    body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, SovmartLangs.description_no);
                }
            }

            header = header.build();
            body = body.build();

            buttons_page_project.groups.push(group_actions, group_info);

            let project_container = SovmartUtils.createElement('div', {'data-project': project.id, 'data-paid': paid}, [header, body]).build();

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
        }).then( data => {
            let grid = '';
            let projects_card = [];
            let ids = [];

            for(let k=0;k<data.items.length;k++) {
                projects_card.push(
                    SovmartUI.renderProjectCard(data.items[k])
                );
                ids.push(data.items[k].id);
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: title,
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

        });
    },


    showProjectsKey: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=projectsKey')
                    .done(function (response) {

                        if(typeof response === 'string') {
                            response = JSON.parse(response);
                        }

                        let items = response.data[0];

                        resolve(items);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then( items => {
            let grid = '';
            let projects_card = [];
            let ids = [];

            // это кастыль пока что
            if(items.items === undefined) {
                items = JSON.parse(items);
            }

            for(let k=0;k<items.items.length;k++) {
                projects_card.push(
                    SovmartUI.renderProjectCard(items.items[k])
                );
                ids.push(parseInt(items.items[k].id));
            }

            grid = SovmartUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: Sovmart.triggerGridRowEndForCard
            });

            page.appendChild(SovmartUI.renderGroup({
                label: SovmartLangs.group_key,
                content: grid
            }));

            SovmartProject.checkInstall({
                ids: ids,
                done: Sovmart.checkInstallProjectCard
            });

        });
    },


    showProjectsFree: function () {
        let page = SovmartUI.renderPage();

        SovmartUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        SovmartUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                SovmartUtils.ajaxGet(Sovmart.url + '&method=projectsFree')
                    .done(function (response) {
                        let items = response.data[0];
                        resolve(items);
                    }).fail(function (xhr) {
                    reject(xhr);
                });

            }
        }).then( items => {
            let grid = '';
            let projects_card = [];
            let ids = [];

            // это кастыль пока что
            if(items.items === undefined) {
                items = JSON.parse(items);
            }

            for(let k=0;k<items.items.length;k++) {
                projects_card.push(
                    SovmartUI.renderProjectCard(items.items[k])
                );
                ids.push(parseInt(items.items[k].id));
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

        });
    },


    loadCategories: function () {
        let url = Sovmart.url + '&method=categories';

        SovmartUtils.ajaxGet(url)
            .done( function (json) {
                json = JSON.parse(json.data);
                let categories_items = json.items;
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

                for (let i = 0; i < categories_items.length; i++) {
                    items.items.push({
                        'label': categories_items[i].title,
                        'class': 'ri-btn ri-btn-default ri-btn-change-category',
                        'data-type': 'category-' + categories_items[i].id,
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    Sovmart.showCategory(categories_items[i].id, categories_items[i].title);
                                }
                            ]
                        ]
                    });
                }

                for(let k=0;k<Sovmart.buttons_page_main.groups.length;k++) {

                    if(Sovmart.buttons_page_main.groups[k].name === 'main') {
                        Sovmart.buttons_page_main.groups[k].items.push(items);
                        break;
                    }

                }

                SovmartUI.showPage({buttons: Sovmart.buttons_page_main})
            });
    },


    initButtonsMain: function () {
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
                                    function(event) {
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
                                    function(event) {
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
                                    function(event) {
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
                                    function(event) {
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
                                    function(event) {
                                        SovmartUtils.openInNewTab(Sovmart.api + '/kontakty');
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

        if(show_alert === null || show_alert === undefined) {
            show_alert = true;
        }

        if(show_toolbar === null || show_toolbar === undefined) {
            show_toolbar = true;
        }

        SovmartProject.checkUpdate({
            done: function (items) {
                let class_list = '';

                if (parseInt(items.count) > 0) {
                    if(show_alert) {
                        SovmartUtils.createAlert(SovmartLangs.text_updated_new, 'info', 5000);
                    }
                } else {
                    class_list = 'empty';
                }

                for(let k=0;k<Sovmart.buttons_page_main.groups.length;k++) {
                    for(let c=0;c<Sovmart.buttons_page_main.groups[k].items.length;c++) {
                        for (let j=0;j<Sovmart.buttons_page_main.groups[k].items.length;j++) {
                            if (Sovmart.buttons_page_main.groups[k].items[j].name === 'updated') {
                                Sovmart.buttons_page_main.groups[k].items[j].label = '<span class="' + class_list + '">' + items.count + '</span> ' + SovmartLangs.updated
                            }
                        }
                    }
                }

                if(show_toolbar) {
                    SovmartUI.showPage({buttons: Sovmart.buttons_page_main});
                }

            }
        })
    },


    checkInstallProjectCard: function (find_ids, ids, updates) {

        for(let k=0;k<ids.length;k++) {
            let cards = SovmartUI.container.querySelectorAll('[data-project="' + ids[k] + '"]');

            if(cards.length === 0) {
                continue;
            }

            for(let i =0;i<cards.length;i++) {
                let paid = cards[i].getAttribute('data-paid');

                cards[i].querySelector('.ri-btn-install').removeAttribute('disabled');

                if(find_ids.indexOf(parseInt(ids[k])) !== -1) {
                    cards[i].querySelector('.ri-btn-install').innerHTML = SovmartLangs.reinstall;
                    cards[i].querySelector('.ri-btn-delete').classList.remove('ri-hidden');
                } else {
                    if(paid === 'paid' && SovmartConfig.key === '') {
                        cards[i].querySelector('.ri-btn-install').innerHTML = SovmartLangs.need_key;

                        cards[i].querySelector('.ri-btn-install').addEventListener('click',function (event) {

                            SovmartUtils.openInNewTab(Sovmart.api + '/kontakty');

                            event.preventDefault();
                            return false;
                        })
                    }
                }

            }

        }

        if(updates.count > 0) {
            for(let j=0;j<updates.items.length;j++) {
                let cards = SovmartUI.container.querySelectorAll('[data-project="' + updates.items[j].project_id + '"]');

                if(cards.length === 0) {
                    continue;
                }

                for(let i =0;i<cards.length;i++) {
                    cards[i].querySelector('.ri-btn-install').innerHTML = SovmartLangs.update;
                    cards[i].querySelector('.radicalinstaller-project-card-version').classList.remove('ri-hidden');
                    cards[i].querySelector('.radicalinstaller-project-card-version').querySelector('.value-last').innerHTML = updates.items[j].version_last;
                    let version = cards[i].querySelector('.radicalinstaller-project-card-version').querySelector('.value').innerHTML;

                    if(version === updates.items[j].version_last) {
                        cards[i].querySelector('.radicalinstaller-project-card-version').querySelector('.value').innerHTML = '';
                    }

                    if(
                        (version !== '' && updates.items[j].version_last !== '') &&
                        (version !==  updates.items[j].version_last)
                    ) {
                        cards[i].querySelector('.radicalinstaller-project-card-version').querySelector('.value-arrow').classList.remove('ri-hidden');
                    }

                    cards[i].querySelector('.radicalinstaller-project-card-version').querySelector('.value-last').classList.remove('ri-hidden');
                }

            }
        }

    },


    checkInstallProjectPage: function(find_ids, ids, updates) {

        for(let k=0;k<ids.length;k++) {
            let project = SovmartUI.container.querySelector('[data-project="' + ids[k] + '"]');

            if(project === undefined || project === null) {
                continue;
            }

            let paid = project.getAttribute('data-paid');

            SovmartUI.container.querySelector('.ri-btn-install').removeAttribute('disabled');

            if(find_ids.indexOf(parseInt(ids[k])) !== -1) {
                SovmartUI.container.querySelector('.ri-btn-install').querySelector('span').innerHTML = SovmartLangs.reinstall;
                SovmartUI.container.querySelector('.ri-btn-delete').classList.remove('ri-hidden');
            } else {
                if(paid === 'paid' && SovmartConfig.key === '') {
                    SovmartUI.container.querySelector('.ri-btn-install').querySelector('span').innerHTML = SovmartLangs.need_key;

                    SovmartUI.container.querySelector('.ri-btn-install').addEventListener('click',function (event) {
                        // TODO отправлять на покупку
                        event.preventDefault();
                    })
                }
            }

        }

        if(updates.count > 0) {
            for(let j=0;j<updates.items.length;j++) {
                let project = SovmartUI.container.querySelector('[data-project="' + updates.items[j].project_id + '"]');

                if(project === undefined || project === null) {
                    continue;
                }

                SovmartUI.container.querySelector('.ri-btn-install').innerHTML = SovmartLangs.update;

            }
        }

    },


    triggerGridRowEndForCard: function(items, grid_row_id) {
        for(let i=0;i<items.length;i++) {
            let button_install = items[i].querySelector('.ri-btn-install');
            let button_delete = items[i].querySelector('.ri-btn-delete');

            if(button_install !== undefined) {
                button_install.setAttribute('data-connect-logs-id', grid_row_id);
            }

            if(button_delete !== undefined) {
                button_delete.setAttribute('data-connect-logs-id', grid_row_id);
            }
        }
    }

}
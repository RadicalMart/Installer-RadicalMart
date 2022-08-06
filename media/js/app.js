window.RadicalInstaller = {

    api: 'https://radicalmart.ru',
    url: 'index.php?option=com_ajax&plugin=radicalinstaller&group=installer&format=json',
    assets: '/media/plg_installer_radicalinstaller/',
    buttons_page_main: {},


    init: function () {
        RadicalInstallerUI.container = document.querySelector('#radicalinstaller-container');
        RadicalInstallerUI.container_form_key = RadicalInstallerUI.container.querySelector('.radicalinstaller-form-key');
        RadicalInstallerUI.container_toolbar = RadicalInstallerUI.container.querySelector('.radicalinstaller-toolbar');
        RadicalInstallerUI.container_page = RadicalInstallerUI.container.querySelector('.radicalinstaller-page');

        this.initButtonsMain();
        this.showStart();
        this.loadCategories();
        this.checkUpdatedProjects();

        RadicalInstallerUI.container_form_key.appendChild(
            RadicalInstallerUI.renderFormKey()
        );
    },


    showStart: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=groupsStartPage')
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
                let group = {
                    label: items[k].title,
                };

                if(items[k].items_required !== undefined) {
                    for(let c=0;c<items[k].items_required.length;c++) {
                        projects_card_required.push(
                            RadicalInstallerUI.renderProjectCard(items[k].items_required[c])
                        );
                        ids.push(parseInt(items[k].items_required[c].id));
                    }

                    for(let c=0;c<items[k].items_not_required.length;c++) {
                        projects_card_not_required.push(
                            RadicalInstallerUI.renderProjectCard(items[k].items_not_required[c])
                        );
                        ids.push(parseInt(items[k].items_not_required[c].id));
                    }

                    grid_required = RadicalInstallerUI.renderProjectGrid({
                        items: projects_card_required,
                        trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
                    });

                    grid_not_required = RadicalInstallerUI.renderProjectGrid({
                        items: projects_card_not_required,
                        trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
                    });

                    /*group.buttons = [
                        {
                            label: 'Установить все',
                            class: 'ri-btn ri-btn-primary',
                            events: [
                                [
                                    'click',
                                    function (event) {

                                    }
                                ]
                            ]
                        }
                    ];*/

                    group.groups = [
                        {
                            label: 'Основные расширения',
                            class: 'radicalinstaller-background-muted',
                            content: grid_required
                        },
                        {
                            label: 'Дополнительные расширения',
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

                        if(c >= 6) {
                            break;
                        }

                        projects_card_required.push(
                            RadicalInstallerUI.renderProjectCard(items[k].items.items[c])
                        );
                        ids.push(parseInt(items[k].items.items[c].id));
                    }

                    group.content = RadicalInstallerUI.renderProjectGrid({
                        items: projects_card_required,
                        trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
                    });

                    if(items[k].name === 'key') {

                        group.actions = [
                            {
                                label: 'Просмотреть все',
                                class: 'ri-btn ri-btn-primary',
                                events: [
                                    [
                                        'click',
                                        function (event) {
                                            RadicalInstaller.showProjectsKey();
                                        }
                                    ]
                                ]
                            }
                        ];

                    }

                    if(items[k].name === 'free') {

                        group.actions = [
                            {
                                label: 'Просмотреть все',
                                class: 'ri-btn ri-btn-primary',
                                events: [
                                    [
                                        'click',
                                        function (event) {
                                            RadicalInstaller.showProjectsFree();
                                        }
                                    ]
                                ]
                            }
                        ];

                    }

                }

                page.appendChild(RadicalInstallerUI.renderGroup(group));

            }

            RadicalInstallerProject.checkInstall({
                ids: ids,
                done: RadicalInstaller.checkInstallProjectCard
            });

        });

    },


    showUpdates: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=checkUpdates')
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
                    RadicalInstallerUI.renderProjectCard(data.items[k])
                );
                ids.push(parseInt(data.items[k].project_id));
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: 'Установлено',
                content: grid
            }));

            RadicalInstallerProject.checkInstall({
                ids: ids,
                done: RadicalInstaller.checkInstallProjectCard
            });

        });
    },


    showInstalled: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=installedList')
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

            for(let k=0;k<items.length;k++) {
                projects_card.push(
                    RadicalInstallerUI.renderProjectCard(items[k])
                );
                ids.push(parseInt(items[k].project_id));
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: 'Установлено',
                content: grid
            }));

            RadicalInstallerProject.checkInstall({
                ids: ids,
                done: RadicalInstaller.checkInstallProjectCard
            });

        });
    },


    showProject: function (id) {
        let page = RadicalInstallerUI.renderPage();
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
                            label: 'Главная',
                            icon: 'ri-home',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function(event) {
                                        RadicalInstaller.showStart();
                                    }
                                ]
                            ]
                        }
                    ]
                }
            ]
        };

        RadicalInstallerUI.showPage({
            buttons: buttons_page_project,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=project&project_id=' + id)
                    .done(function (response) {
                        let project = JSON.parse(response.data);
                        resolve(project);
                    }).fail(function (xhr) {
                    reject(xhr);
                });
            }
        }).then(project => {

            let header = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-width-1-2@l radicalinstaller-margin-bottom'}),
                body = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-width-1-2@l radicalinstaller-project-page'}),
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
                docs = RadicalInstaller.api + project.documentation;
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
                for (let i = 0; i < item.gallery.length; i++) {
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
                if (project.images !== undefined) {
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
                            'src': RadicalInstaller.api + '/' + project.images.cover
                        })
                        .getParent();
                }
            }

            header = header.getParent();

            body = body.add('h2', {'class': 'radicalinstaller-project-page_gallery-header'}, project.title);
            let check_install = false;

            if (project.download_type === 'free') {
                check_install = true;
            }

            if (project.download_type === 'paid') {
                if (RadicalInstallerConfig.key !== '') {
                    check_install = true;
                }
            }

            if (check_install) {
                group_actions.items.push({
                    label: RadicalInstallerLangs.button_install,
                    icon: 'ri-download',
                    class: 'ri-btn ri-btn-default ri-btn-success ri-btn-install',
                    disabled: 'disabled',
                    events: [
                        [
                            'click',
                            function (ev) {
                                let button_install = this;
                                let button_delete = RadicalInstallerUI.getContainerToolbar().querySelector('.ri-btn-delete');
                                let logs_container = RadicalInstallerUI.getContainerPage().querySelector('.radicalinstaller-logs');

                                logs_container.innerHTML = '';

                                button_install.setAttribute('disabled', 'disabled');
                                button_install.innerHTML = 'Устанавливается';

                                RadicalInstallerProject.install({
                                    ids: [id],
                                    success: function (response, project_install_id, position) {
                                        let success = false;
                                        let data = JSON.parse(response.data);

                                        logs_container.append(RadicalInstallerUI.renderLogsClose());

                                        if (data.messages !== undefined && data.messages !== null) {
                                            for (let i = data.messages.length - 1; i >= 0; i--) {
                                                logs_container.append(
                                                    RadicalInstallerUtils.createElement(
                                                        'div',
                                                        {},
                                                        '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>'
                                                    ).build()
                                                );
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
                                            button_install.querySelector('span').innerHTML = 'Переустановить';

                                            if(
                                                button_delete !== undefined &&
                                                button_delete !== null
                                            ) {
                                                button_delete.classList.remove('ri-hidden');
                                                button_delete.removeAttribute('disabled');
                                            }

                                            RadicalInstaller.checkUpdatedProjects(false, false);
                                        } else {
                                            button_install.querySelector('span').innerHTML = 'Установить';
                                        }

                                        button_install.removeAttribute('disabled');
                                    },
                                    fail: function() {
                                        button_install.querySelector('span').innerHTML = 'Установить';
                                        button_install.removeAttribute('disabled');
                                        logs_container.append(RadicalInstallerUI.renderLogsClose());
                                        logs_container.append(
                                            RadicalInstallerUtils.createElement(
                                                'div',
                                                {},
                                                '<div class="alert alert-danger">' + 'Не удалось установить расширение' + '</div>'
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
                    label: RadicalInstallerLangs.button_buy,
                    icon: 'ri-link',
                    class: 'ri-btn ri-btn-default ri-btn-success',
                    events: [
                        [
                            'click',
                            function (ev) {
                                RadicalInstallerUtils.openInNewTab(RadicalInstaller.api + project.link);
                                ev.preventDefault();
                                return false;
                            }
                        ]
                    ],
                });
            }

            group_actions.items.push({
                label: RadicalInstallerLangs.button_delete,
                icon: 'ri-trash',
                class: 'ri-btn ri-btn-default ri-btn-danger ri-btn-delete ri-hidden',
                events: [
                    [
                        'click',
                        function (ev) {


                            let button_install = RadicalInstallerUI.getContainerToolbar().querySelector('.ri-btn-install');
                            let button_delete = this;
                            let logs_container = RadicalInstallerUI.getContainerPage().querySelector('.radicalinstaller-logs');

                            logs_container.innerHTML = '';

                            button_delete.setAttribute('disabled', 'disabled');
                            button_delete.innerHTML = 'Удаляется';

                            RadicalInstallerProject.delete({
                                id: [id],
                                success: function (response, project_delete_id) {
                                    let success = false;
                                    let data = response;

                                    logs_container.append(RadicalInstallerUI.renderLogsClose());

                                    if (data.messages !== undefined && data.messages !== null) {
                                        for (let i = data.messages.length - 1; i >= 0; i--) {
                                            logs_container.append(
                                                RadicalInstallerUtils.createElement(
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

                                    button_delete.innerHTML = 'Удалить';

                                    if(success) {
                                        button_delete.classList.add('ri-hidden');

                                        if(
                                            button_install !== undefined &&
                                            button_install !== null
                                        ) {
                                            button_install.innerHTML = 'Установить';
                                        }

                                        RadicalInstaller.checkUpdatedProjects(false, false);
                                    }

                                    button_delete.removeAttribute('disabled');
                                },
                                fail: function() {
                                    button_delete.innerHTML = 'Удалить';
                                    button_delete.removeAttribute('disabled');
                                    logs_container.append(RadicalInstallerUI.renderLogsClose());
                                    logs_container.append(
                                        RadicalInstallerUtils.createElement(
                                            'div',
                                            {},
                                            '<div class="alert alert-danger">' + 'Не удалось удалить расширение' + '</div>'
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
                    label: RadicalInstallerLangs.button_docs,
                    icon: 'ri-link',
                    class: 'ri-btn ri-btn-default',
                    events: [
                        [
                            'click',
                            function(event) {
                                RadicalInstallerUtils.openInNewTab(docs);
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
                    label: RadicalInstallerLangs.button_support,
                    class: 'ri-btn ri-btn-default',
                    icon: 'ri-link',
                    events: [
                        [
                            'click',
                            function(event) {
                                RadicalInstallerUtils.openInNewTab(support);
                            }
                        ]
                    ]
                });
            }

            body.add('div', {'class': 'radicalinstaller-project-page_description-header'}, RadicalInstallerLangs.description);

            if (
                project.fulltext !== undefined &&
                project.fulltext !== ''
            ) {
                body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, project.fulltext);
            } else {
                if(project.introtext !== undefined && project.introtext !== '') {
                    body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, project.introtext);
                } else {
                    body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, RadicalInstallerLangs.text_no_description);
                }
            }

            header = header.build();
            body = body.build();

            buttons_page_project.groups.push(group_actions, group_info);

            let project_container = RadicalInstallerUtils.createElement('div', {'data-project': project.id, 'data-paid': paid}, [header, body]).build();

            RadicalInstallerUI.showPage({
                buttons: buttons_page_project,
                page: project_container
            });

            RadicalInstallerProject.checkInstall({
                ids: [parseInt(project.id)],
                done: RadicalInstaller.checkInstallProjectPage
            });

        });

    },


    showCategory: function (id, title) {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=projects&category_id=' + id)
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
                    RadicalInstallerUI.renderProjectCard(data.items[k])
                );
                ids.push(data.items[k].id);
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: title,
                content: grid
            }));

            RadicalInstallerProject.checkInstall({
                ids: ids,
                done: RadicalInstaller.checkInstallProjectCard
            });

        });
    },


    showProjectsKey: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=projectsKey')
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
                    RadicalInstallerUI.renderProjectCard(items.items[k])
                );
                ids.push(parseInt(items.items[k].id));
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: 'Доступные по ключу',
                content: grid
            }));

            RadicalInstallerProject.checkInstall({
                ids: ids,
                done: RadicalInstaller.checkInstallProjectCard
            });

        });
    },


    showProjectsFree: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_main,
            page: page
        });

        RadicalInstallerUI.loaderShow({
            container: page,
            wait: function (resolve, reject) {

                RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=projectsFree')
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
                    RadicalInstallerUI.renderProjectCard(items.items[k])
                );
                ids.push(parseInt(items.items[k].id));
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card,
                trigger_grid_row_end_for: RadicalInstaller.triggerGridRowEndForCard
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: 'Бесплатные',
                content: grid
            }));

            RadicalInstallerProject.checkInstall({
                ids: ids,
                done: RadicalInstaller.checkInstallProjectCard
            });

        });
    },


    loadCategories: function () {
        let url = RadicalInstaller.url + '&method=categories';

        RadicalInstallerUtils.ajaxGet(url)
            .done( function (json) {
                json = JSON.parse(json.data);
                let categories_items = json.items;
                let items = {
                    dropdown: {
                        label: 'Категория',
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
                                    RadicalInstaller.showCategory(categories_items[i].id, categories_items[i].title);
                                }
                            ]
                        ]
                    });
                }

                for(let k=0;k<RadicalInstaller.buttons_page_main.groups.length;k++) {

                    if(RadicalInstaller.buttons_page_main.groups[k].name === 'main') {
                        RadicalInstaller.buttons_page_main.groups[k].items.push(items);
                        break;
                    }

                }

                RadicalInstallerUI.showPage({buttons: RadicalInstaller.buttons_page_main})
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
                            label: 'Главная',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function(event) {
                                        RadicalInstaller.showStart();
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
                            label: 'Обновления',
                            class: 'ri-btn ri-btn-default ri-btn-check-update',
                            events: [
                                [
                                    'click',
                                    function(event) {
                                        RadicalInstaller.showUpdates();
                                    }
                                ]
                            ]
                        },
                        {
                            name: 'installed',
                            icon: 'ri-download',
                            label: 'Установленно',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function(event) {
                                        RadicalInstaller.showInstalled();
                                    }
                                ]
                            ]
                        },
                        {
                            name: 'sync',
                            icon: 'ri-sync',
                            label: 'Синхронизация',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function(event) {
                                        RadicalInstallerProject.sync({
                                            done: function () {
                                                RadicalInstaller.checkUpdatedProjects();
                                                RadicalInstaller.showStart();
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
                            label: 'Поддержка',
                            class: 'ri-btn ri-btn-default',
                            events: [
                                [
                                    'click',
                                    function(event) {
                                        RadicalInstallerUtils.openInNewTab(RadicalInstaller.api + '/kontakty');
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
        0
        RadicalInstallerProject.checkUpdate({
            done: function (items) {
                let class_list = '';

                if (parseInt(items.count) > 0) {
                    if(show_alert) {
                        RadicalInstallerUtils.createAlert(RadicalInstallerLangs.text_new_updated, 'info', 5000);
                    }
                } else {
                    class_list = 'empty';
                }

                for(let k=0;k<RadicalInstaller.buttons_page_main.groups.length;k++) {
                    for(let c=0;c<RadicalInstaller.buttons_page_main.groups[k].length;c++) {
                        for (let j=0;j<RadicalInstaller.buttons_page_main.groups[k].items.length;j++) {
                            if (RadicalInstaller.buttons_page_main.groups[k].items[j].name === 'updated') {
                                RadicalInstaller.buttons_page_main.groups[k].items[j].label = '<span class="' + class_list + '">' + items.count + '</span> ' + RadicalInstallerLangs.button_update
                            }
                        }
                    }
                }

                if(show_toolbar) {
                    RadicalInstallerUI.showPage({buttons: RadicalInstaller.buttons_page_main});
                }

            }
        })
    },


    checkInstallProjectCard: function (find_ids, ids, updates) {

        for(let k=0;k<ids.length;k++) {
            let cards = RadicalInstallerUI.container.querySelectorAll('[data-project="' + ids[k] + '"]');

            if(cards.length === 0) {
                continue;
            }

            for(let i =0;i<cards.length;i++) {
                let paid = cards[i].getAttribute('data-paid');

                cards[i].querySelector('.ri-btn-install').removeAttribute('disabled');

                if(find_ids.indexOf(parseInt(ids[k])) !== -1) {
                    cards[i].querySelector('.ri-btn-install').innerHTML = 'Переустановить';
                    cards[i].querySelector('.ri-btn-delete').classList.remove('ri-hidden');
                } else {
                    if(paid === 'paid' && RadicalInstallerConfig.key === '') {
                        cards[i].querySelector('.ri-btn-install').innerHTML = 'Нужен ключ';

                        cards[i].querySelector('.ri-btn-install').addEventListener('click',function (event) {

                            RadicalInstallerUtils.openInNewTab(RadicalInstaller.api + '/kontakty');

                            event.preventDefault();
                            return false;
                        })
                    }
                }

            }

        }

        if(updates.count > 0) {
            for(let j=0;j<updates.items.length;j++) {
                let cards = RadicalInstallerUI.container.querySelectorAll('[data-project="' + updates.items[j].project_id + '"]');

                if(cards.length === 0) {
                    continue;
                }

                for(let i =0;i<cards.length;i++) {
                    cards[i].querySelector('.ri-btn-install').innerHTML = 'Обновить';
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
            let project = RadicalInstallerUI.container.querySelector('[data-project="' + ids[k] + '"]');

            if(project === undefined || project === null) {
                continue;
            }

            let paid = project.getAttribute('data-paid');

            RadicalInstallerUI.container.querySelector('.ri-btn-install').removeAttribute('disabled');

            if(find_ids.indexOf(parseInt(ids[k])) !== -1) {
                RadicalInstallerUI.container.querySelector('.ri-btn-install').querySelector('span').innerHTML = 'Переустановить';
                RadicalInstallerUI.container.querySelector('.ri-btn-delete').classList.remove('ri-hidden');
            } else {
                if(paid === 'paid' && RadicalInstallerConfig.key === '') {
                    RadicalInstallerUI.container.querySelector('.ri-btn-install').querySelector('span').innerHTML = 'Нужен ключ';

                    RadicalInstallerUI.container.querySelector('.ri-btn-install').addEventListener('click',function (event) {
                        // TODO отправлять на покупку
                        event.preventDefault();
                    })
                }
            }

        }

        if(updates.count > 0) {
            for(let j=0;j<updates.items.length;j++) {
                let project = RadicalInstallerUI.container.querySelector('[data-project="' + updates.items[j].project_id + '"]');

                if(project === undefined || project === null) {
                    continue;
                }

                RadicalInstallerUI.container.querySelector('.ri-btn-install').innerHTML = 'Обновить';

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
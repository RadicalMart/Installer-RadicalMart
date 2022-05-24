window.RadicalInstaller = {

    api: 'https://radicalmart.ru',
    url: 'index.php?option=com_ajax&plugin=radicalinstaller&group=installer&format=json',
    assets: '/media/plg_installer_radicalinstaller/',
    buttons_page_grid: {
        groups: [
            {
                name: 'main',
                items: [
                    {
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
                        label: 'Обновления',
                        class: 'ri-btn ri-btn-default',
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
                        label: 'Синхронизация',
                        class: 'ri-btn ri-btn-default',
                        events: [
                            [
                                'click',
                                function(event) {
                                    RadicalInstallerProject.sync();
                                }
                            ]
                        ]
                    }
                ]
            }
        ]
    },


    init: function () {
        RadicalInstallerUI.container = document.querySelector('#radicalinstaller-container');
        RadicalInstallerUI.container_form_key = RadicalInstallerUI.container.querySelector('.radicalinstaller-form-key');
        RadicalInstallerUI.container_toolbar = RadicalInstallerUI.container.querySelector('.radicalinstaller-toolbar');
        RadicalInstallerUI.container_page = RadicalInstallerUI.container.querySelector('.radicalinstaller-page');
        this.showStart();
        this.loadCategories();

        RadicalInstallerUI.container_form_key.appendChild(
            RadicalInstallerUI.renderFormKey()
        );
    },


    showStart: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_grid,
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

            for(let k in items) {
                let grid_required = '';
                let grid_not_required = '';
                let projects_card_required = [];
                let projects_card_not_required = [];

                for(let c in items[k].items_required) {
                    projects_card_required.push(
                        RadicalInstallerUI.renderProjectCard(items[k].items_required[c])
                    );
                }

                for(let c in items[k].items_not_required) {
                    projects_card_not_required.push(
                        RadicalInstallerUI.renderProjectCard(items[k].items_not_required[c])
                    );
                }

                grid_required = RadicalInstallerUI.renderProjectGrid({
                    items: projects_card_required
                });

                grid_not_required = RadicalInstallerUI.renderProjectGrid({
                    items: projects_card_not_required
                });

                page.appendChild(RadicalInstallerUI.renderGroup({
                    label: items[k].title,
                    buttons: [
                        {
                            label: 'Установить все',
                            class: 'ri-btn ri-btn-primary',
                            events: [
                                [
                                    'click',
                                    function (event) {
                                        console.log('click');
                                    }
                                ]
                            ]
                        }
                    ],
                    groups: [
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
                    ]
                }));

            }

        });

    },


    showUpdates: function () {

    },


    showInstalled: function () {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_grid,
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

            for(let k in items) {
                projects_card.push(
                    RadicalInstallerUI.renderProjectCard(items[k])
                );
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: 'Установлено',
                content: grid
            }));

        });
    },


    showProject: function (id) {
        let page = RadicalInstallerUI.renderPage();
        let buttons_page_project = [
            {
                label: 'Назад',
                class: 'ri-btn ri-btn-default',
                events: [
                    [
                        'click',
                        function(event) {
                            RadicalInstaller.showStart();
                        }
                    ]
                ]
            },
        ];

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

            let header = RadicalInstallerUtils.createElement('div', {class: 'radicalinstaller-width-1-2@l'}),
                body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-width-1-2@l radicalinstaller-project-page'}),
                color = '#eee',
                docs = '',
                support = '';

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

            if (project.download_type === 'paid') {
                if (RadicalInstallerConfig.key !== '') {
                    buttons_page_project.push({
                        label: '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_install,
                        class: 'ri-btn ri-btn-default ri-btn-success ri-btn-install',
                        //'disabled': 'disabled',
                        events: [
                            [
                                'click',
                                function (ev) {
                                    //self.installProject(item);
                                }
                            ]
                        ],
                    });
                } else {
                    buttons_page_project.push({
                        label: RadicalInstallerLangs.button_buy,
                        class: 'ri-btn ri-btn-default ri-btn-success',
                        events: [
                            [
                                'click',
                                function (ev) {
                                    window.open(RadicalInstaller.api + project.link, '_target');
                                    ev.preventDefault();
                                    return false;
                                }
                            ]
                        ],
                    });
                }

            } else {
                buttons_page_project.push({
                    label: '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_install,
                    class: 'ri-btn ri-btn-default ri-btn-success ri-btn-install',
                    //disabled: 'disabled',
                    events: [
                        [
                            'click',
                            function (ev) {

                            }
                        ]
                    ],
                });
            }

            buttons_page_project.push({
                label: RadicalInstallerLangs.button_delete,
                class: 'ri-btn ri-btn-default ri-btn-danger ri-btn-delete',
                events: [
                    [
                        'click',
                        function (ev) {
                            //RadicalInstaller.deleteProject(item);
                        }
                    ]
                ]
            });

            if (
                docs !== undefined &&
                docs !== false &&
                docs !== ''
            ) {
                buttons_page_project.push({
                    label: RadicalInstallerLangs.button_docs,
                    class: 'ri-btn ri-btn-default',
                    events: []
                });
            }

            if (
                support !== undefined &&
                support !== false &&
                support !== ''
            ) {
                buttons_page_project.push({
                    label: RadicalInstallerLangs.button_support,
                    class: 'ri-btn ri-btn-default',
                    events: []
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

            RadicalInstallerUI.showPage({
                buttons: buttons_page_project,
                page: [header, body]
            });

        });

    },


    showCategory: function (id) {
        let page = RadicalInstallerUI.renderPage();

        RadicalInstallerUI.showPage({
            buttons: this.buttons_page_grid,
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

            for(let k in data.items) {
                projects_card.push(
                    RadicalInstallerUI.renderProjectCard(data.items[k])
                );
            }

            grid = RadicalInstallerUI.renderProjectGrid({
                items: projects_card
            });

            page.appendChild(RadicalInstallerUI.renderGroup({
                label: 'Категория',
                content: grid
            }));

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
                                    RadicalInstaller.showCategory(categories_items[i].id);
                                }
                            ]
                        ]
                    });
                }

                group.items.push(items);
                RadicalInstaller.buttons_page_grid.groups.push(group);

                RadicalInstallerUI.showPage({buttons: RadicalInstaller.buttons_page_grid})
            });
    }


}
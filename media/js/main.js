window.RadicalInstaller = {
    api: 'https://radicalmart.ru',
    url: 'index.php?option=com_ajax&plugin=radicalinstaller&group=installer&format=json',
    container: null, // контейнер HTML для установщика
    form: null, // форма HTML установки Joomla
    category_id: 0, // текущая активная категория расширений
    categories: null, // список категорий расширений в тулбар
    check_main_after_install: false, // флаг для того чтобы смотреть после установки основного расширения
    button_active: null, // активная кнопка в тулбаре
    depends_wait: true, // флаг для ожидания загрузки зависимостей
    list_install: [], // список установленных расширений
    buy_projects: [], // список купленных расширений
    template_sidebar: {
        'key': {
            header: 'Что такое ключ',
            content: 'Lorem lorem lorem text text text.'
        },
        'faq': {
            header: 'FAQ',
            content: 'Lorem lorem lorem text text text.'
        }
    },

    /**
     * Запуск установщика
     */
    init: function () {
        let self = this;
        this.container = document.querySelector('#radicalinstaller-container');
        this.form = document.querySelector('#adminForm');

        // если нет ключа, то запускаем показ формы ввода ключа
        if (RadicalInstallerConfig.key === '') {
            self.showFormKey();
            return;
        }

        // если ключ есть, то запускаем проверку установки одного из основного расширения
        self.checkMainExtension();
    },


    /**
     * Смена категории расширений
     *
     * @param id
     */
    changeCategory: function (id) {
        let self = this,
            grid = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-grid'}),
            pagination = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-pagination'});

        // очищаем весь основной контейнер и вставляем в него базовые элементы для каталога
        self.renderPage({
            header: 'Каталог расширений',
            content: [grid.build(), pagination.build()],
            sidebar: [
                {header: 'Категории', content: self.categories.build()},
                {template: 'faq'}
            ]
        })

        // запускаем показ экрана загрузки
        self.loaderInit();
        self.loaderShow();

        if (RadicalInstallerConfig.key !== '') {
            let url = self.url + '&method=buyprojects';

            RadicalInstallerUtils.ajaxGet(url).done( function (json) {
                self.buy_projects = json.items;
            });
        }

        // load_page замыкание, которое потом вызываем внутри себя при клике на пагинацию
        let load_page = function (page, limit) {
            let url = self.url + '&method=projects&category_id=' + id;

            if (page !== null) {
                url += '&page=' + page;
            }

            if (limit !== null) {
                url += 'l&imit=' + limit;
            }

            RadicalInstallerUtils.ajaxGet(url)
            .done( function (json) {
                json = JSON.parse(json.data);
                let cards = json.items;

                for (let i=0;i<cards.length;i++) {
                    self.container.querySelector('.radicalinstaller-grid').append(self.renderCatalogGrid(cards[i]).build());
                }

                self.setColors();
                self.checkInstall();
                self.checkUpdates();
                self.loaderHide();

                self.container.querySelector('.radicalinstaller-pagination').innerHTML = '';
                if (json.pagination !== undefined) {
                    let last_page = parseInt(json.pagination.pagesTotal),
                        page_limit = parseInt(json.pagination.limit),
                        current_page = parseInt(json.pagination.pagesCurrent);

                    if (last_page > current_page) {
                        let pagination_button = RadicalInstallerUtils.createElement('button', {
                            'class': 'btn btn-large radicalinstaller-pagination_more', 'events': [
                                [
                                    'click',
                                    function (ev) {
                                        load_page(current_page + 1, page_limit);
                                        ev.preventDefault();
                                        return true;
                                    }
                                ]
                            ]
                        }, RadicalInstallerLangs.button_load_more);

                        self.container.querySelector('.radicalinstaller-pagination').append(pagination_button.build());
                    }

                }

            });
        }

        self.category_id = id;
        load_page();

        // отключаем всем кнопкам классы активности
        let buttons_all = document.querySelectorAll('.radicalinstaller-categories button');
        for (let i = 0; i < buttons_all.length; i++) {
            buttons_all[i].classList.remove('btn-active');
        }

        // находим активную кнопку и ей назначаем класс активности
        let button_active = document.querySelector('button[data-type="category-' + self.category_id + '"]');
        if (button_active !== null && button_active !== undefined) {
            button_active.classList.add('btn-active');
        }
    },


    /**
     * Запуск показа каталога
     */
    showCatalog: function () {
        let self = this;
        this.checkUpdates();

        self.categories = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-categories'});
        self.categories.add('button', {
            'class': 'btn', 'data-type': 'installed', 'events': [
                [
                    'click',
                    function (ev) {
                        self.showInstalled();
                        ev.preventDefault();
                    }
                ]
            ]
        }, RadicalInstallerLangs.button_installed);

        self.categories.add('button', {
            'class': 'btn btn-check-update', 'data-type': 'update', 'events': [
                [
                    'click',
                    function (ev) {
                        self.showUpdates();
                        ev.preventDefault();
                    }
                ]
            ]
        }, '<span class="empty">0</span> ' + RadicalInstallerLangs.button_update);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'support', 'events': [
                [
                    'click',
                    function (ev) {
                        window.open(self.api + '/support', '_target');
                        ev.preventDefault();
                        return false;
                    }
                ]
            ]
        }, RadicalInstallerLangs.button_support);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'add', 'events': [
                [
                    'click',
                    function (ev) {
                        window.open(self.api + '/add', '_target');
                        ev.preventDefault();
                        return false;
                    }
                ]
            ]
        }, RadicalInstallerLangs.button_extension_add);

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'category-0', 'events': [
                [
                    'click',
                    function (ev) {
                        self.changeCategory(0);
                        ev.preventDefault();
                    }
                ]
            ]
        }, 'Все расширения');

        self.categories.add('button', {
            'class': 'btn btn-change-category', 'data-type': 'category--1', 'events': [
                [
                    'click',
                    function (ev) {
                        self.changeCategory(-1);
                        ev.preventDefault();
                    }
                ]
            ]
        }, 'Доступные мне');

        // здесь замыкание не обязательно, но оставил по аналогии с загрузкой каталога
        // получаем с API список доступных категорий для каталога
        let load_categories = function () {
            let url = self.url + '&method=categories';

            RadicalInstallerUtils.ajaxGet(url)
            .done( function (json) {
                json = JSON.parse(json.data);
                let categories_items = json.items;
                for (let i = 0; i < categories_items.length; i++) {
                    self.categories.add('button', {
                        'class': 'btn btn-change-category',
                        'data-type': 'category-' + categories_items[i].id,
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    self.changeCategory(categories_items[i].id);
                                    ev.preventDefault();
                                }
                            ]
                        ]
                    }, categories_items[i].title);
                }

                let search_categories = self.container.querySelector('.radicalinstaller-categories');

                if (search_categories !== null && search_categories !== undefined) {
                    let container = search_categories.parentElement;
                    search_categories.remove();
                    container.append(self.categories.build());
                }
            });
        }

        self.changeCategory(self.category_id);
        load_categories();
    },


    /**
     * Показ формы ввода ключа
     */
    showFormKey: function () {
        let self = this,
            form = RadicalInstallerUtils.createElement('form', {
            'class': 'form-horizontal span7',
            'events': [
                [
                    'submit',
                    function (event) {
                        // отправить аякс на сохранение ключа
                        let key_value = event.target.querySelector('[name=key]').value;
                        RadicalInstallerUtils.ajaxPost(self.url + '&method=saveKey', {key: key_value})
                            .done(function (response) {
                                self.checkMainExtension();
                                RadicalInstallerConfig.key = key_value; // можем присвоить ключ, так как сервер примет только проверенный ключ
                            })
                            .fail(function (xhr) {

                            });
                        event.preventDefault();
                        return false;
                    }
                ]
            ]
        })
        .addChild('div', {'class': 'radicalinstaller-card radicalinstaller-background-muted radicalinstaller-padding-large'})
            .addChild('div', {'class': 'control-group control-group-no-label control-group-large'})
                .addChild('div', {'class': 'controls'})
                    .add('input', {'class': 'span12', 'type': 'text', 'placeholder': 'Введите здесь ваш ключ', 'name': 'key'})
                    .getParent()
                .getParent()
            .addChild('div', {'class': 'control-group control-group-no-label control-group-large'})
                .addChild('div', {'class': 'controls'})
                    .add('button', {'class': 'btn btn-primary btn-large', 'type': 'submit'}, 'Отправить')
                    .getParent()
                .getParent()

        self.renderPage({
            header: 'Установка расширений из <a href="https://radicalmart.ru" target="_blank">radicalmart.ru</a>',
            description: 'Для того чтобы продолжить, Вам необходимо установить ключ обращения к сервису.',
            content: form.build(),
            sidebar: [
                {'template': 'key'},
                {'template': 'faq'}
            ]
        })
    },


    /**
     * Показывает подробную карточку расширения
     *
     * @param id
     */
    showProject: function (id) {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + id)
        .done(function (json) {
            let item = JSON.parse(json.data),
                header = RadicalInstallerUtils.createElement('div'),
                body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-project-page'}),
                color = RadicalInstallerUtils.generateColorFromText(item.title),
                docs = item.urls.documentation,
                support = item.urls.support;

            // проверяем наличии документации у расширения
            if (item.documentation !== undefined && item.documentation !== false && item.documentation !== '') {
                docs = self.api + item.documentation;
            }

            if (item.params !== undefined) {
                if (item.params.attrs_color !== undefined && item.params.attrs_color !== '') {
                    color = item.params.attrs_color;
                }
            }

            // проверяем наличии галереи у расширения и генерируем DOM, если она есть
            if (item.gallery.length > 0) {
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
                            'alt': item.gallery[i].text,
                            'src': self.api + '/' + item.gallery[i].src
                        })
                        .add('div', {'class': 'radicalinstaller-project-page_gallery-images-element_caption'}, item.gallery[i].text)
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
                if (item.images !== undefined) {
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
                            'src': self.api + '/' + item.images.cover
                        })
                        .getParent();
                }
            }

            body = body.add('h2', {'class': 'radicalinstaller-project-page_gallery-header'}, item.title);
            body = body.addChild('div', {'class': 'radicalinstaller-project-page_buttons'});

            if (item.download_type === 'paid') {
                if (RadicalInstallerConfig.key !== '') {
                    body = body.add('button', {
                        'class': 'btn btn-success btn-large btn-install',
                        'disabled': 'disabled',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    self.installProject(item);
                                }
                            ]]
                    }, '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_install);
                } else {
                    body = body.add('button', {
                        'class': 'btn btn-success btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    window.open(self.api + item.link, '_target');
                                    ev.preventDefault();
                                    return false;
                                }
                            ]]
                    }, 'Купить');
                }

            } else {
                body = body.add('button', {
                    'class': 'btn btn-success btn-large btn-install',
                    'disabled': 'disabled',
                    'events': [
                        [
                            'click',
                            function (ev) {
                                self.installProject(item);
                            }
                        ]]
                }, '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_install);
            }

            if (docs !== undefined && docs !== false && docs !== '') {
                body = body.add('a', {
                    'class': 'btn btn-large',
                    'target': '_blank',
                    'href': docs
                }, RadicalInstallerLangs.button_docs);
            }

            body = body.add('a', {
                'class': 'btn btn-large',
                'target': '_blank',
                'href': support
            }, RadicalInstallerLangs.button_support)
                .add('a', {
                    'class': 'btn btn-large btn-text',
                    'target': '_blank',
                    'href': self.api + item.link
                }, RadicalInstallerLangs.button_extension_website)
                .getParent();


            body.add('div', {'class': 'radicalinstaller-project-page_description-header'}, RadicalInstallerLangs.description);

            if (item.fulltext !== undefined && item.fulltext !== '') {
                body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, item.fulltext);
            } else {
                body = body.add('div', {'class': 'radicalinstaller-project-page_description-text'}, item.introtext);
            }

            header = header.build();
            body = body.build();

            // это остаточный код на будущее, выводит расширения которые должны быть установленны вместе с этим расширением
            if (item.fullwillbeinstalled !== undefined) {
                if (item.fullwillbeinstalled.length > 0) {
                    let relations_html = RadicalInstallerUtils.createElement('radicalinstaller-project-page_relations')
                        .add('h3', {
                            'class': 'radicalinstaller-project-page_relations-header'
                        }, RadicalInstallerLangs.will_be_installed)
                        .addChild('div', {
                            'class': 'radicalinstaller-project-page_relations-list'
                        });

                    for (let i = 0; i < item.fullwillbeinstalled.length; i++) {
                        relations_html = relations_html.add('div', {
                            'class': 'radicalinstaller-project-page_relations-list_link',
                            'events': [
                                [
                                    'click',
                                    function (ev) {
                                        self.showProject(item.fullwillbeinstalled[i].id)
                                        ev.preventDefault();
                                    }
                                ]
                            ]
                        }, item.fullwillbeinstalled[i].title);
                    }

                    relations_html = relations_html.getParent();
                    body.appendChild(relations_html.build());
                }

            }

            RadicalInstallerUtils.modal(header, body);

            // запрашиваем локально у сервера, установлено ли это расширение и рисуем нужные кнопки в зависимости от состояния
            RadicalInstallerUtils.ajaxGet(self.url + '&method=checkInstall&list=' + JSON.stringify([item.element]))
            .done(function (json) {
                let buttonInstall = body.querySelector('.btn-install');
                let find = json.data[0];

                if (buttonInstall !== undefined && buttonInstall !== null) {
                    buttonInstall.removeAttribute('disabled');
                }

                if (find.indexOf(item.element) !== -1) {
                    buttonInstall.innerHTML = '<span class="icon-checkmark-2 large-icon"></span> ' + RadicalInstallerLangs.button_reinstall;
                }

            });
        });
    },


    /**
     * Находит зависимости для проекта
     *
     *
     * @param project
     */
    findDepends: function (project) {
        let self = this;
        self.depends_wait = true;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=getForInstallDepends&project_id=' + project.id,)
        .done(function (json) {
            let depends = JSON.parse(json.data);
            for (let i = 0; i < depends.length; i++) {
                self.list_install.push({id: depends[i].id, title: depends[i].title});
            }
            self.depends_wait = false;
        });
    },


    /**
     * Запуск установки проекта
     *
     * @param project
     * @param depends
     * @param show_modal
     * @param callback_success
     * @param callback_fail
     */
    installProject: function (project, depends, show_modal, callback_success, callback_fail) {
        let self = this;

        self.list_install = [];
        self.list_install.push({id: project.id, title: project.title});

        if (depends === null || depends === undefined || depends === true) {
            self.findDepends(project);
        } else {
            self.depends_wait = false;
        }

        if (show_modal === null || show_modal === undefined || show_modal === true) {
            show_modal = true;
        } else {
            show_modal = false;
        }

        // интервал, потому что ожидаем загрузки всех завимостей для установки расширения
        let waitGetListDepends = setInterval(function () {

            if (self.depends_wait) {
                return;
            }

            if (show_modal) {
                let header = RadicalInstallerUtils.createElement('h1', {'class': ''}, RadicalInstallerLangs.installing_an_extension),
                    body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-install-page'});

                body = body
                    .addChild('table', {'class': 'radicalinstaller-updates-page_tables table table-striped table-hover'})
                        .addChild('thead')
                            .addChild('tr')
                                .add('th', {}, RadicalInstallerLangs.extension_name)
                                .add('th', {}, RadicalInstallerLangs.status)
                                .add('th', {}, '')
                                .getParent()
                            .getParent()
                        .addChild('tbody');

                for (let i = 0; i < self.list_install.length; i++) {
                    body = body
                        .addChild('tr', {'class': 'radicalinstaller-install-page_tables-element-id-' + self.list_install[i].id})
                            .add('td', {}, self.list_install[i].title)
                            .add('td', {'class': 'radicalinstaller-install-page_tables-element-status'}, RadicalInstallerLangs.wait)
                            .add('td', {'class': 'radicalinstaller-install-page_tables-element-action'})
                            .getParent()
                        .addChild('tr', {'class': 'radicalinstaller-install-page_tables-element-messages'})
                            .add('td', {
                                'class': 'radicalinstaller-install-page_tables-element-id-' + self.list_install[i].id + '-messages hidden',
                                'colspan': 3
                            })
                            .getParent()
                }

                body = body.getParent().getParent();
                RadicalInstallerUtils.modal(header.build(), body.build(), '', '', function () {
                    if(self.check_main_after_install) {
                        self.checkMainExtension();
                    }
                });
            }

            //проходим что нам надо установить и ставим
            for (let i = 0; i < self.list_install.length; i++) {

                //получаем проект
                RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + self.list_install[i].id)
                .done( function (json) {
                    let item = JSON.parse(json.data),
                        install = item.install,
                        url = '';

                    if (install === '' || install === 'joomla') {
                        url = self.url + '&method=installJoomla&id=' + item.id;
                    }

                    RadicalInstallerUtils.ajaxGet(url)
                    .done( function (response) {
                        let element,
                            success = false,
                            modal_body = document.querySelector('.radicalinstaller-install-page_loader'),
                            buttons = undefined,
                            messages = '',
                            data = JSON.parse(response['data']);

                        if (show_modal) {
                            element = document.querySelector('.radicalinstaller-install-page_tables-element-id-' + item.id);
                            element.querySelector('.radicalinstaller-install-page_tables-element-action').innerHTML = '';
                        }

                        if (data.messages !== undefined && data.messages !== null) {
                            for (let i = data.messages.length - 1; i >= 0; i--) {
                                messages += '<div class="alert alert-' + data.messages[i].type + '">' + data.messages[i].message + '</div>';
                            }
                        }

                        if (response.success === true) {
                            if (data.status === undefined || data.status === null || data.status === 'fail') {
                                success = false;
                            } else {
                                success = true;
                            }
                        }

                        if (!success) {
                            if (show_modal) {
                                element.querySelector('.radicalinstaller-install-page_tables-element-status').innerHTML = RadicalInstallerLangs.installation_error;
                                buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-install-page_buttons'})
                                    .add('button', {
                                        'class': 'btn',
                                        'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    self.installProject(item, false);
                                                }
                                            ]
                                        ]
                                    }, '<span class="icon-loop"></span> ' + RadicalInstallerLangs.try_again);

                                if (messages !== '') {
                                    buttons = buttons.add('button', {
                                        'class': 'btn',
                                        'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    let element_messages = document.querySelector('.radicalinstaller-install-page_tables-element-id-' + item.id + '-messages');

                                                    if (element_messages.classList.contains('hidden')) {
                                                        this.innerHTML = RadicalInstallerLangs.hide_messages;
                                                        element_messages.classList.remove('hidden');
                                                    } else {
                                                        this.innerHTML = RadicalInstallerLangs.show_messages;
                                                        element_messages.classList.add('hidden');
                                                    }
                                                }
                                            ]
                                        ]
                                    }, RadicalInstallerLangs.show_messages);
                                }
                            }

                            if (typeof callback_fail === 'function') {
                                callback_fail();
                            }
                        } else {
                            if (show_modal) {
                                element.querySelector('.radicalinstaller-install-page_tables-element-status').innerHTML = RadicalInstallerLangs.button_installed;
                            }

                            if (messages !== '') {
                                buttons = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-install-page_buttons'})
                                    .add('button', {
                                        'class': 'btn',
                                        'events': [
                                            [
                                                'click',
                                                function (ev) {
                                                    let element_messages = document.querySelector('.radicalinstaller-install-page_tables-element-id-' + item.id + '-messages');

                                                    if (element_messages.classList.contains('hidden')) {
                                                        this.innerHTML = RadicalInstallerLangs.hide_messages;
                                                        element_messages.classList.remove('hidden');
                                                    } else {
                                                        this.innerHTML = RadicalInstallerLangs.show_messages;
                                                        element_messages.classList.add('hidden');
                                                    }
                                                }
                                            ]
                                        ]
                                    }, RadicalInstallerLangs.show_messages);
                            }

                            if (typeof callback_success === 'function') {
                                callback_success();
                            }

                            self.checkInstall();
                            self.checkUpdates();
                        }

                        if (show_modal) {
                            if (buttons !== undefined) {
                                element.querySelector('.radicalinstaller-install-page_tables-element-action').appendChild(buttons.build());
                            }

                            if (messages !== '') {
                                let element_messages = document.querySelector('.radicalinstaller-install-page_tables-element-id-' + self.list_install[i].id + '-messages');

                                element_messages.innerHTML = '';
                                messages = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-install-page_messages'}, messages);
                                element_messages.appendChild(messages.build());
                            }
                        }

                    });

                });
            }


            clearInterval(waitGetListDepends);

        }, 300);

    },


    /**
     * Установить цвета для карточек расширений
     */
    setColors: function () {
        let self = this,
            cards = self.container.querySelectorAll('.radicalinstaller-card');

        for (let i = 0; i < cards.length; i++) {
            let color = cards[i].querySelector('.radicalinstaller-card_color'),
                text = cards[i].querySelector('.radicalinstaller-card_title');
            if(color !== undefined && color !== null) {
                color.style.backgroundColor = RadicalInstallerUtils.generateColorFromText(text.textContent);
            }
        }

    },


    /**
     * Проверка установленных расширений
     */
    checkInstall: function () {
        let self = this,
            list_for_find = [],
            cards = self.container.querySelectorAll('.radicalinstaller-card');

        for (let i = 0; i < cards.length; i++) {
            list_for_find.push(cards[i].getAttribute('data-element'));
        }

        RadicalInstallerUtils.ajaxGet(this.url + '&method=checkInstall&list=' + JSON.stringify(list_for_find))
        .done( function (json) {
            let find = json.data[0];
            for (let i = 0; i < find.length; i++) {
                let card = self.container.querySelector('.radicalinstaller-card[data-element="' + find[i] + '"]');
                if (card !== null) {
                    card.classList.add('radicalinstaller-card_installed');
                    card.setAttribute('data-installed', RadicalInstallerLangs.button_installed);
                }
            }
        });

    },


    /**
     * Проверка обновлений
     */
    checkUpdates: function () {
        let self = this,
            button_check_update = document.querySelector('.btn-check-update');

        if (button_check_update !== null && button_check_update !== undefined) {
            RadicalInstallerUtils.ajaxGet(self.url + '&method=checkUpdates').done( function (response) {
                let data = JSON.parse(response.data);
                if (parseInt(data.count) > 0) {
                    button_check_update.innerHTML = '<span>' + data.count + '</span> ' + RadicalInstallerLangs.button_update;
                } else {
                    button_check_update.innerHTML = '<span class="empty">' + data.count + '</span> ' + RadicalInstallerLangs.button_update;
                }
            });
        }

    },


    /**
     * Проверка на основные расширения
     *
     */
    checkMainExtension: function () {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=checkMainExtension')
            .done(function (response) {

                let data = response.data[0];

                if (data.status === 'ok') {
                    self.showCatalog();
                }

                if (data.status === 'notinstall') {
                    let grid = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-grid'}),
                        grid_element = null;

                    self.renderPage({
                        header: 'Выберите главное расширение',
                        description: 'текст текст',
                        content: grid.build(),
                        sidebar: [
                            {template: 'faq'}
                        ]
                    });

                    self.loaderInit();
                    self.loaderShow();
                    grid_element = self.container.querySelector('.radicalinstaller-grid');

                    for (let i=0;i<data.items.length;i++) {
                        grid_element.append(self.renderCatalogGrid(data.items[i]).build());
                    }

                    self.setColors();
                    self.loaderHide();
                    self.check_main_after_install = true;
                }
            })
            .fail(function (xhr) {

            });
    },


    /**
     * Показ обновлений расширений
     *
     */
    showUpdates: function () {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=checkUpdates')
            .done(function(response) {
                let data = JSON.parse(response.data);

                let header = RadicalInstallerUtils.createElement('h2', {'class': ''}, RadicalInstallerLangs.extension_updates);
                let body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-updates-page'});
                body = body.addChild('div', {'class': 'radicalinstaller-updates-page_buttons'})
                    .add('button', {
                        'class': 'btn btn-success btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    for (let i = 0; i < data.items.length; i++) {
                                        RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + data.items[i].project_id)
                                        .done(function (json) {
                                            let item = JSON.parse(json.data),
                                                element = document.querySelector('.radicalinstaller-updates-page_tables-element-id-' + data.items[i].project_id);
                                                btn = element.querySelector('.btn');

                                            if (btn !== null) {
                                                btn.setAttribute('disabled', 'disabled');
                                                btn.innerHTML = RadicalInstallerLangs.updating;
                                            }

                                            self.installProject(item, false, false, function (data, messages) {
                                                element.remove();
                                                let table = document.querySelector('.radicalinstaller-updates-page_tables');

                                                if (table !== null) {
                                                    if (table.querySelectorAll('tbody tr').length === 0) {
                                                        self.showUpdates();
                                                        self.checkUpdates();
                                                    }
                                                }
                                            }, function () {
                                                if (btn !== null) {
                                                    btn.removeAttribute('disabled');
                                                    btn.innerHTML = RadicalInstallerLangs.update;
                                                }
                                            });
                                        });
                                    }
                                    ev.preventDefault();
                                }
                            ]
                        ]
                    }, '<span class="icon-download large-icon"></span> ' + RadicalInstallerLangs.button_update_all)
                    .add('button', {
                        'class': 'btn btn-large',
                        'events': [
                            [
                                'click',
                                function (ev) {
                                    self.showUpdates();
                                    ev.preventDefault();
                                }
                            ]
                        ]
                    }, '<span class="icon-loop large-icon"></span> ' + RadicalInstallerLangs.button_update_check);

                if (parseInt(data.count) > 0) {
                    body =
                        body.addChild('table', {'class': 'radicalinstaller-updates-page_tables table table-striped table-hover'})
                                .addChild('thead')
                                    .addChild('tr')
                                        .add('th', {}, RadicalInstallerLangs.extension_name)
                                        .add('th', {}, RadicalInstallerLangs.current_version)
                                        .add('th', {}, RadicalInstallerLangs.new_version)
                                        .add('th', {}, '')
                                        .getParent()
                                .getParent()
                            .addChild('tbody')

                    for (let i = 0; i < data.items.length; i++) {
                        body =
                            body.addChild('tr', {'class': 'radicalinstaller-updates-page_tables-element-id-' + data.items[i].project_id})
                                    .add('td', {}, data.items[i].title)
                                    .add('td', {}, data.items[i].version)
                                    .add('td', {}, data.items[i].version_last)
                                        .addChild('td')
                                            .add('button', {
                                    'class': 'btn', 'events': [
                                        [
                                            'click',
                                            function (ev) {
                                                RadicalInstallerUtils.ajaxGet(self.url + '&method=project&project_id=' + data.items[i].project_id)
                                                .done( function (json) {
                                                    let item = JSON.parse(json.data);
                                                    let element = document.querySelector('.radicalinstaller-updates-page_tables-element-id-' + data.items[i].project_id);
                                                    let btn = element.querySelector('.btn');

                                                    if (btn !== null) {
                                                        btn.setAttribute('disabled', 'disabled');
                                                        btn.innerHTML = RadicalInstallerLangs.updating;
                                                    }

                                                    self.installProject(item, false, false, function (data, messages) {
                                                        element.remove();
                                                        self.checkUpdates();
                                                    }, function () {
                                                        if (btn !== null) {
                                                            btn.removeAttribute('disabled');
                                                            btn.innerHTML = RadicalInstallerLangs.update;
                                                        }
                                                    });

                                                });
                                            }
                                        ]
                                    ]
                                }, 'Обновить')
                                            .getParent()
                                    .getParent()
                    }

                    body = body.getParent().getParent();
                } else {
                    body = body.add('div', {'class': 'radicalinstaller-updates-empty'}, RadicalInstallerLangs.no_updates)
                }

                header = header.build();
                body = body.build();

                RadicalInstallerUtils.modal(header, body);
         });
    },


    /**
     * Показ установленных расширений
     *
     */
    showInstalled: function () {
        let self = this;
        RadicalInstallerUtils.ajaxGet(self.url + '&method=installedList').done(function (response) {
            let data = response.data[0];
            let header = RadicalInstallerUtils.createElement('h2', {'class': ''}, RadicalInstallerLangs.extension_installed);
            let body = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-installed-page'});

            if (data.length > 0) {
                body =
                    body.addChild('table', {'class': 'radicalinstaller-installed-page_tables table table-striped table-hover'})
                            .addChild('thead')
                                .addChild('tr')
                                    .add('th', {}, RadicalInstallerLangs.extension_name)
                                    .add('th', {}, RadicalInstallerLangs.current_version)
                                    .add('th', {}, '')
                                    .getParent()
                                .getParent()
                        .addChild('tbody')

                for (let i = 0; i < data.length; i++) {
                    body =
                        body.addChild('tr', {'class': 'radicalinstaller-installed-page_tables-element-id-' + data[i].project_id})
                                .add('td', {}, data[i].title)
                                .add('td', {}, data[i].version)
                                    .addChild('td', {'class': 'radicalinstaller-installed-page_buttons'})
                                        .add('button', {
                                'class': 'btn btn-width-fixed', 'events': [
                                    [
                                        'click',
                                        function (ev) {
                                            self.showProject(data[i].project_id);
                                            ev.preventDefault();
                                        }
                                    ]
                                ]
                            }, RadicalInstallerLangs.button_view)
                                    .getParent()
                            .getParent()
                }

                body = body.getParent().getParent();
            } else {
                body = body.add('div', {'class': 'radicalinstaller-installed-empty'}, RadicalInstallerLangs.no_installed)
            }

            header = header.build();
            body = body.build();

            RadicalInstallerUtils.modal(header, body);

        });
    },


    renderPage: function (data) {
        let self = this,
            header_content = data.header,
            description_content = data.description,
            content_content = data.content,
            sidebar = data.sidebar,
            page = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-page'});

        page = page.add('h1', {'class': 'radicalinstaller-page_header'}, header_content);

        if(description_content !== '') {
            page = page.add('p', {'class': 'radicalinstaller-page_description'}, description_content);
        }

        page = page.addChild('div', {'class': 'radicalinstaller-page_wrap'})
                .add('div', {'class': 'radicalinstaller-page_content'})
                .addChild('div', {'class': 'radicalinstaller-page_sidebar radicalinstaller-background-muted'});

        if(
            typeof sidebar === 'object' ||
            typeof sidebar === 'array'
        )
        {
            for(let i=0;i<sidebar.length;i++)
            {
                let item_header = '',
                    item_content = '';

                if(
                    sidebar[i].template !== undefined &&
                    self.template_sidebar[sidebar[i].template] !== undefined
                )
                {
                    item_header = self.template_sidebar[sidebar[i].template].header;
                    item_content = self.template_sidebar[sidebar[i].template].content;
                }

                if(sidebar[i].header !== undefined && sidebar[i].content) {
                    item_header = sidebar[i].header;
                    item_content = sidebar[i].content;
                }

                page = page.addChild('div', {'class': 'radicalinstaller-page_sidebar-item'})
                    .add('h3', {'class': 'radicalinstaller-page_sidebar-item_title'}, item_header)
                    .add('div', {'class': 'radicalinstaller-page_sidebar-item_content'}, item_content)
                    .getParent();

            }
        }

        page = page.getParent().getParent();
        self.container.innerHTML = '';
        self.container.append(page.build());


        if(typeof content_content === 'object') {
            let content = document.querySelector('.radicalinstaller-page_content');

            if(typeof content_content[Object.keys(content_content)[0]] === 'object') {
                for(let i=0;i<content_content.length;i++) {
                    content.append(content_content[i]);
                }
            } else {
                content.append(content_content);
            }
        }

    },

    /**
     * Отрисовывает карточку расширения
     *
     * @param item
     * @returns object
     */
    renderCatalogGrid: function (item) {
        let self = this;

            let color = '#ccc',
                docs = item.urls.documentation,
                support = item.urls.support;

            if (item.documentation !== undefined && item.documentation !== '' && item.documentation !== false) {
                docs = self.api + item.documentation;
            }

            if (item.params !== undefined) {
                item.params = JSON.parse(item.params);
            }

            if (item.params.attrs_color !== undefined && item.params.attrs_color !== '') {
                color = item.params.attrs_color;
            }

            let grid_cards = RadicalInstallerUtils.createElement('div', {}).
            addChild('div', {
                    'class': 'radicalinstaller-card radicalinstaller-card_extension',
                    'data-install': '0',
                    'data-element': item.element,
                    'events': [
                        [
                            'click',
                            function (ev) {
                                if (!ev.target.classList.contains('btn-install')) {
                                    self.showProject(item.id);
                                    ev.preventDefault();
                                }
                            }
                        ]
                    ]
                });

            if(item.images !== undefined)
            {
                grid_cards
                    .addChild('div', {'class': 'radicalinstaller-card_image'})
                        .add('div', {'class': 'radicalinstaller-card_color', 'style': 'opacity: .1'})
                        .add('div', {
                            'class': 'radicalinstaller-card_cover',
                            'style': item.images.cover !== false ? ('background-image:url(' + self.api + '/' + item.images.cover + ')') : ''
                        })
                        .getParent();
            }


            grid_cards.add('h3', {'class': 'radicalinstaller-card_title'}, item.title);

        return grid_cards;
    },


    /**
     * Добавление в DOM экрана загрузки
     */
    loaderInit: function () {
        let self = this,
            loader = RadicalInstallerUtils.createElement('div', {'class': 'radicalinstaller-loader hide'})
            .add('img', {'src': '/media/plg_installer_radicalinstaller/img/loader.svg'});
        self.container.appendChild(loader.build());
    },

    /**
     * Запуск показа экрана загрузки
     */
    loaderShow: function () {
        let loader = document.querySelector('.radicalinstaller-loader');
        if (loader !== null) {
            loader.classList.remove('hide');
        }
    },


    /**
     * Скрытие экрана загрузки
     */
    loaderHide: function () {
        let loader = document.querySelector('.radicalinstaller-loader');
        if (loader !== null) {
            loader.classList.add('hide');
        }
    }

}
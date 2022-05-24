window.RadicalInstaller = {

    api: 'https://radicalmart.ru',
    url: 'index.php?option=com_ajax&plugin=radicalinstaller&group=installer&format=json',
    assets: '/media/plg_installer_radicalinstaller/',
    buttons_page_grid: [
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
        },
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
    ],
    buttons_page_project: [
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
    ],


    init: function () {
        RadicalInstallerUI.container = document.querySelector('#radicalinstaller-container');
        RadicalInstallerUI.container_form_key = RadicalInstallerUI.container.querySelector('.radicalinstaller-form-key');
        RadicalInstallerUI.container_toolbar = RadicalInstallerUI.container.querySelector('.radicalinstaller-toolbar');
        RadicalInstallerUI.container_page = RadicalInstallerUI.container.querySelector('.radicalinstaller-page');
        this.showStart();

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
                let grid = '';
                let projects_card = [];

                for(let c in items[k].items_required) {
                    projects_card.push(
                        RadicalInstallerUI.renderProjectCard(items[k].items_required[c])
                    );
                }

                grid = RadicalInstallerUI.renderProjectGrid({
                    items: projects_card
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
                    content: grid
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

    }



}
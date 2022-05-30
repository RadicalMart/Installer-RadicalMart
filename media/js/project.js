window.RadicalInstallerProject = {

    install: function (args) {
        let ids_count = args.ids.length,
            ids_current = 0;

        for (let i = 0; i < ids_count; i++) {

            if (typeof args.wait === 'function') {
                args.wait(args.ids[i]);
            }

            RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=installJoomla&id=' + args.ids[i])
                .done(function (response) {
                    let data = JSON.parse(response.data);

                    ids_current++;

                    if (typeof args.success === 'function') {
                        args.success(data, args.ids[i], ids_current);
                    }

                })
                .fail(function () {

                    ids_current++;

                    if (typeof args.success === 'fail') {
                        args.fail(args.ids[i], ids_current);
                    }

                });
        }

    },


    update: function (args) {
        return this.install(args);
    },


    delete: function (args) {

        let is_delete = confirm(RadicalInstallerLangs.question_extension_delete);

        if (!is_delete) {
            return;
        }


        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=installJoomla&id=' + args.ids[i])
            .done(function (response) {
                let data = JSON.parse(response.data);

                ids_current++;

                if (typeof args.success === 'function') {
                    args.success(data, args.ids[i], ids_current);
                }

            })
            .fail(function () {

                ids_current++;

                if (typeof args.success === 'fail') {
                    args.fail(args.ids[i], ids_current);
                }

            });

    },


    checkInstall: function (args) {
        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=checkInstall&list=' + JSON.stringify(args.ids))
            .done( function (json) {
                let find = json.data[0];

                if (typeof args.done === 'function') {
                    args.done(find, args.ids);
                }
            });
    },


    sync: function (args) {
        RadicalInstallerUtils.ajaxGet(RadicalInstaller.url + '&method=syncExtensions')
            .done(function (json) {
                let count = json.data;

                RadicalInstallerUtils.createAlert(RadicalInstallerLangs.text_sync + count, 'info', 5000);

                if(typeof args.done === 'function') {
                    args.done();
                }
            })
            .fail(function (xhr) {
                let data = JSON.parse(xhr.responseText);
                RadicalInstallerUtils.createAlert(data.data, 'danger', 5000);

                if(typeof args.fail === 'function') {
                    args.fail();
                }
            });
    }

};
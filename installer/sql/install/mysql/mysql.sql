DROP TABLE IF EXISTS `#__sovmart_extensions`;
CREATE TABLE `#__sovmart_extensions`
(
    `id`             int(10) unsigned NOT NULL AUTO_INCREMENT,
    `title`          varchar(512)  NOT NULL,
    `provider`       varchar(512)  NOT NULL,
    `type`           varchar(512)  NOT NULL,
    `element`        varchar(512)  NOT NULL,
    `folder`         varchar(512)  NOT NULL,
    `version`        varchar(100)  NOT NULL,
    `branch`         varchar(100)  NOT NULL,
    `project_id`     int(10) unsigned NOT NULL,
    `extension_id`   int(10) unsigned NOT NULL,
    `category_title` varchar(1024) NOT NULL,
    PRIMARY KEY (`id`),
    KEY              `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
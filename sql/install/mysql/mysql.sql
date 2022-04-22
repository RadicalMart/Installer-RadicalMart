DROP TABLE IF EXISTS `#__radicalinstaller_extensions`;
CREATE TABLE `#__radicalinstaller_extensions`
(
    `id`                    int(10) unsigned NOT NULL AUTO_INCREMENT,
    `title`                 varchar(512) NOT NULL,
    `type_radicalinstaller` varchar(512) NOT NULL,
    `type`                  varchar(512) NOT NULL,
    `element`               varchar(512) NOT NULL,
    `folder`                varchar(512) NOT NULL,
    `version`               varchar(100) NOT NULL,
    `project_id`            int(10) unsigned NOT NULL,
    `extension_id`          int(10) unsigned NOT NULL,
    PRIMARY KEY (`id`),
    KEY                     `project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
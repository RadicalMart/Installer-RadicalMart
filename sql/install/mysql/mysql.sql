CREATE TABLE `#__radicalinstaller_extensions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(512) NOT NULL,
  `type` varchar(512) NOT NULL,
  `element` varchar(512) NOT NULL,
  `enable` tinyint(1) NOT NULL DEFAULT 1,
  `version` varchar(100) NOT NULL,
  `project_id` int(10) unsigned NOT NULL,
  `params` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
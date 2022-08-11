ALTER TABLE `#__radicalinstaller_extensions`
    CHANGE `type_radicalinstaller` `provider` varchar (512) COLLATE 'utf8mb3_general_ci' NOT NULL AFTER `title`;
ALTER TABLE `#__sovmart_extensions`
    CHANGE `type_sovmart` `provider` varchar (512) COLLATE 'utf8mb3_general_ci' NOT NULL AFTER `title`;
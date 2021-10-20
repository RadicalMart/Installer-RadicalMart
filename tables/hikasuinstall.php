<?php defined('_JEXEC') or die;

use Joomla\CMS\Table\Table;

class TableHikasuInstall extends Table
{

    /**
     * Constructor
     *
     * @param   JDatabaseDriver  $db  Database driver object.
     *
     * @since   1.0.0
     */
    public function __construct(JDatabaseDriver $db)
    {
        parent::__construct('#__hikasu_install', 'id', $db);
    }

}
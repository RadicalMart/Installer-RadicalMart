<?php defined('_JEXEC') or die;

use Joomla\CMS\Table\Table;

class TableSovmartExtensions extends Table
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
        parent::__construct('#__sovmart_extensions', 'id', $db);
    }

}
<?php defined('_JEXEC') or die;

use Joomla\CMS\Table\Table;

class TableRadicalinstallerExtensions extends Table
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
        parent::__construct('#__radicalinstaller_extensions', 'id', $db);
    }

}
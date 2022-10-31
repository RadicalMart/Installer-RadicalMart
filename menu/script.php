<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Installer\InstallerAdapter;
use Joomla\CMS\Version;

class plgSystemSovmartmenuInstallerScript
{


	/**
	 * Runs right after any installation action.
	 *
	 * @param   string            $type    Type of PostFlight action. Possible values are:
	 * @param   InstallerAdapter  $parent  Parent object calling object.
	 *
	 * @since  1.1.0
	 */
	function postflight($type, $parent)
	{

		if (version_compare((new Version())->getShortVersion(), '4.0', '<'))
		{
			return;
		}

		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query->update('#__extensions')->set('enabled=1')->where('type=' . $db->q('plugin'))->where('element=' . $db->q('sovmartmenu'));
		$db->setQuery($query)->execute();
	}

}
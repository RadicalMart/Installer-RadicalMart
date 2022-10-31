<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;

/**
 * Sovmarticon script file.
 *
 * @package     A package name
 * @since       1.0
 */
class plgQuickiconSovmarticonInstallerScript
{

	/**
	 * Called after any type of action
	 *
	 * @param   string            $route    Which action is happening (install|uninstall|discover_install|update)
	 * @param   JAdapterInstance  $adapter  The object responsible for running this script
	 *
	 * @return  boolean  True on success
	 */
	public function postflight($route, $adapter)
	{
		$db    = Factory::getDbo();
		$query = $db->getQuery(true);
		$query->update('#__extensions')->set('enabled=1')->where('type=' . $db->q('plugin'))->where('element=' . $db->q('sovmarticon'));
		$db->setQuery($query)->execute();
	}

}
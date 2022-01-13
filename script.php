<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Installer\InstallerAdapter;
use Joomla\Registry\Registry;

class plgInstallerRadicalinstallerInstallerScript
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
		// Enable plugin
		if ($type === 'install')
		{
			$db = Factory::getDbo();
			$elements_key = ['com_radicalmart', 'com_radicalmart_express'];
			$find_key = '';
			$plugin          = new stdClass();
			$plugin->type    = 'plugin';
			$plugin->element = $parent->getElement();
			$plugin->folder  = (string) $parent->getParent()->manifest->attributes()['group'];
			$plugin->enabled = 1;


			$query = $db->getQuery(true);
			$query
				->select('params')
				->from($db->quoteName('#__extensions'))
				->where($this->db->qn('element') . ' IN (' . implode(',', $elements_key) . ')');
			$find_list = $this->db->setQuery($query)->loadObjectList();

			foreach ($find_list as $item)
			{
				$params_item = new Registry($item->params);
				$find_key = $params_item->get('product_key', '');
			}

			if(!empty($find_key))
			{
				$params = new Registry();
				$plugin->params = $params->toString();
			}

			// Update record
			$db->updateObject('#__extensions', $plugin, ['type', 'element', 'folder']);
		}
	}

}
<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\CMSPlugin;

/**
 * Class plgQuickiconSovmarticon
 */
class plgQuickiconSovmarticon extends CMSPlugin
{

	public function onGetIcons($context)
	{

		if (
			$context !== $this->params->get('context', 'mod_quickicon') ||
			!Factory::getUser()->authorise('core.manage', 'com_installer')
		)
		{
			return;
		}

		return [
			[
				'link'  => 'index.php?option=com_installer&view=install#sovmart',
				'image' => 'icon-upload',
				'text'  => 'Sovmart',
				'id'    => 'plg_quickicon_sovmarticon',
			]
		];
	}


}
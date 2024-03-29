<?php defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Menu\AdministratorMenuItem;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Database\DatabaseDriver;

class plgSystemSovmartmenu extends CMSPlugin
{


	protected $app;


	protected $db;


	protected $autoloadLanguage = true;


	protected $loadAdminMenu = false;


	public function onPreprocessMenuItems($context, $children)
	{

		if (
			!$this->app->isClient('administrator') ||
			!Factory::getUser()->authorise('core.manage', 'com_installer') ||
			($this->app->input->get('option') === 'com_installer' && $this->app->input->get('view') === 'install') ||
			$this->loadAdminMenu === true
		)
		{
			return;
		}

		$parent = new AdministratorMenuItem([
			'title'     => 'PLG_SOVMARTMENU_MENU',
			'type'      => 'component',
			'link'      => 'index.php?option=com_installer&view=install#sovmart',
			'element'   => 'com_installer',
			'class'     => 'class:upload',
			'ajaxbadge' => null,
			'dashboard' => false
		]);

		/* @var $root AdministratorMenuItem */
		$root = $children[0]->getParent();
		$root->addChild($parent);
		$this->loadAdminMenu = true;

	}

}
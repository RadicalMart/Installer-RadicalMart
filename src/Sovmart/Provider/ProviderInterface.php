<?php namespace Sovmart\Provider;

defined('_JEXEC') or die;

interface ProviderInterface
{

	public function start($id);


	public function delete($id);


	public function getMessages();


	public function toggleEnable($id);


	public function toggleDisable($id);


}
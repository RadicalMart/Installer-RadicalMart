<?php namespace Radicalinstaller;

defined('_JEXEC') or die;

interface ProviderInterface
{

    public function start($id);


    public function delete($id);


    public function toggleEnable($id);

}
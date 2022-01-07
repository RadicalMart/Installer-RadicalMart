<?php namespace Radicalinstaller;

interface ProviderInterface
{

    public function start($id);

    public function delete($id);

    public function toggleEnable($id);

}
<?php namespace Hikasu;

interface ProviderInterface
{

    public function start($id);

    public function delete($id);

    public function toggleEnable($id);

}
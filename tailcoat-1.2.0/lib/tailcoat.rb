require 'compass'
base_directory  = File.join(File.dirname(__FILE__), '..', 'lib')
Compass::Frameworks.register('tailcoat', :path => base_directory)
desc "Run those specs"
task :spec do
  require "rubygems"
  require 'spec/rake/spectask'

  Spec::Rake::SpecTask.new do |t|
    t.spec_files = FileList['spec/**/*_spec.rb']
  end
end


# Jekyll plugin to automatically generate API data
# This runs during Jekyll build on GitHub Pages

require 'json'
require 'yaml'

module Jekyll
  class ApiDataGenerator < Generator
    safe true
    priority :low

    def generate(site)
      # Read all project YAML files
      projects = []
      categories = Set.new

      Dir.glob('_data/projects/*.yml').each do |file|
        data = YAML.load_file(file)
        next unless data

        id = File.basename(file, '.yml')
        project = data.merge('id' => id)
        projects << project

        # Collect categories
        if data['category']
          data['category'].each { |cat| categories << cat }
        end
      end

      # Create API data structure
      api_data = {
        'projects' => projects,
        'categories' => categories.to_a.sort,
        'total' => projects.length,
        'updated' => Time.now.iso8601
      }

      # Write combined data file
      File.write('api/data/projects.json', JSON.pretty_generate(api_data))

      # Write JavaScript module for easy client-side access
      js_content = "// Auto-generated Drupal Tools data\nwindow.DrupalToolsData = #{JSON.generate(api_data)};"
      File.write('api/data/drupal-tools-data.js', js_content)

      # Create individual project files
      projects.each do |project|
        File.write(
          "api/data/#{project['id']}.json",
          JSON.pretty_generate(project)
        )
      end

      Jekyll.logger.info "API Data Generator: Generated #{projects.length} projects with #{categories.size} categories"
    end
  end
end
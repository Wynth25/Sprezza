class SandboxSeeder
  def self.seed
    puts "Generating Baskets..."
    ikape  = Basket.create!(name: "Bottomless Ikape", min_dose: 16.0, max_dose: 19.0, position: 1)
    ims    = Basket.create!(name: "IMS Precision",    min_dose: 18.0, max_dose: 22.0, position: 2)
    rocket = Basket.create!(name: "Rocket Double",    min_dose: 14.0, max_dose: 18.0, position: 3)

    puts "Generating Beans with dynamic dates near today..."
    today = Date.current

    beans_data = [
      { key: :doubleshot, roastery: "Doubleshot",       name: "Era",        description: "Bolivia - Palli Family, Caturra, Washed", notes: "Drupe, almonds and molasses",  roast_days_ago: 14, frozen_days_ago: 10 },
      { key: :candycane,  roastery: "Candycane Coffee", name: "El Paraiso", description: "Colombia, Castillo, Anaerobic",           notes: "Strawberry, lychee, bubblegum", roast_days_ago: 7,  frozen_days_ago: nil },
      { key: :nordbeans,  roastery: "Nordbeans",        name: "Antigua",    description: "Guatemala, Bourbon, Washed",              notes: "Caramel, green apple, cocoa",   roast_days_ago: 9,  frozen_days_ago: nil },
      { key: :naughty,    roastery: "Naughty Dog",      name: "Tarrazu",    description: "Costa Rica, Caturra, Natural",            notes: "Plum, dark chocolate, cinnamon", roast_days_ago: 15, frozen_days_ago: nil }
    ]

    beans = {}
    beans_data.each_with_index do |data, index|
      beans[data[:key]] = Bean.create!(
        roastery: data[:roastery],
        name: data[:name],
        description: data[:description],
        notes: data[:notes],
        roast_date: today - data[:roast_days_ago].days,
        frozen_on: data[:frozen_days_ago] ? (today - data[:frozen_days_ago].days) : nil,
        archived: false,
        position: index + 1
      )
    end

    puts "Generating Recipes and Brew History..."
    recipes_data = [
      [:doubleshot, ikape,  "Espresso"],
      [:doubleshot, ims,    "Espresso"],
      [:candycane,  ikape,  "Espresso"],
      [:nordbeans,  ikape,  "Espresso"],
      [:nordbeans,  ims,    "Espresso"],
      [:nordbeans,  ikape,  "Lungo"],
      [:naughty,    ikape,  "Espresso"],
      [:naughty,    rocket, "Espresso"]
    ]

    positions = Hash.new(0)
    recipes_data.each do |bean_key, basket, style|
      positions[bean_key] += 1
      recipe = Recipe.create!(
        bean: beans[bean_key],
        basket: basket,
        style: style,
        archived: false,
        position: positions[bean_key]
      )

      current_dose = rand(basket.min_dose..basket.max_dose).round(1)
      current_grind = rand(3.0..6.0).round(1)

      rand(2..4).times do
        current_dose = (current_dose + rand(-0.5..0.5)).clamp(basket.min_dose, basket.max_dose).round(1)
        current_grind = (current_grind + rand(-0.4..0.4)).round(1)

        Brew.create!(
          recipe: recipe,
          dose: current_dose,
          grind: current_grind,
          created_at: (today - rand(0..5).days - rand(0..12).hours)
        )
      end
    end

    puts "Database seeded successfully with dynamic dial-in data!"
  end
end

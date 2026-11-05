require "test_helper"

class SandboxActionsTest < ActionDispatch::IntegrationTest
  test "sandbox bean CRUD actions all function properly" do
    # 1. Create Bean
    assert_difference "Bean.count", 1 do
      post beans_path, params: {
        bean: {
          name: "Sandbox Ethiopian",
          roastery: "Coffee Lab",
          roast_date: Date.current - 10.days
        }
      }
    end
    assert_redirected_to beans_path
    bean = Bean.last
    assert_equal "Sandbox Ethiopian", bean.name

    # 2. Edit / Update Bean
    patch bean_path(bean), params: {
      bean: {
        name: "Sandbox Ethiopian Washed",
        notes: "Floral and bergamot"
      }
    }
    assert_redirected_to beans_path
    bean.reload
    assert_equal "Sandbox Ethiopian Washed", bean.name
    assert_equal "Floral and bergamot", bean.notes

    # 3. Update Freeze Date
    freeze_date = Date.current - 2.days
    patch bean_path(bean), params: {
      bean: {
        frozen_on: freeze_date
      }
    }
    assert_redirected_to beans_path
    bean.reload
    assert_equal freeze_date, bean.frozen_on
    assert_equal freeze_date, bean.freeze_date

    # 4. Archive Bean
    patch archive_bean_path(bean)
    assert_redirected_to beans_path
    assert bean.reload.archived?

    # 5. Sort Beans
    patch sort_beans_path, params: { bean_ids: [bean.id] }
    assert_response :success
    assert_equal 1, bean.reload.position

    # 6. Delete Bean (Requires exact "delete" confirmation)
    assert_no_difference "Bean.count" do
      delete bean_path(bean), params: { confirmation: "cancel" }
    end
    assert_redirected_to edit_bean_path(bean)

    assert_difference "Bean.count", -1 do
      delete bean_path(bean), params: { confirmation: "delete" }
    end
    assert_redirected_to beans_path
    assert_nil Bean.find_by(id: bean.id)
  end

  test "sandbox basket CRUD actions all function properly" do
    # 1. Create Basket
    assert_difference "Basket.count", 1 do
      post baskets_path, params: {
        basket: {
          name: "Sandbox VST 18g",
          min_dose: 17.5,
          max_dose: 19.5
        }
      }
    end
    assert_redirected_to baskets_path
    basket = Basket.last
    assert_equal "Sandbox VST 18g", basket.name
    assert_equal 17.5, basket.min_dose
    assert_equal 19.5, basket.max_dose

    # 2. Edit / Update Basket (Fix for basket edit in sandbox)
    patch basket_path(basket), params: {
      basket: {
        name: "Sandbox VST 20g",
        min_dose: 19.0,
        max_dose: 21.0
      }
    }
    assert_redirected_to baskets_path
    basket.reload
    assert_equal "Sandbox VST 20g", basket.name
    assert_equal 19.0, basket.min_dose
    assert_equal 21.0, basket.max_dose

    # 3. Sort Baskets
    patch sort_baskets_path, params: { basket_ids: [basket.id] }
    assert_response :success
    assert_equal 1, basket.reload.position

    # 4. Delete Basket
    assert_difference "Basket.count", -1 do
      delete basket_path(basket)
    end
    assert_redirected_to baskets_path
    assert_nil Basket.find_by(id: basket.id)
  end

  test "sandbox recipe and brew actions function properly" do
    bean = beans(:one)
    basket = baskets(:one)

    # 1. Create Recipe with initial brew
    assert_difference -> { Recipe.count } => 1, -> { Brew.count } => 1 do
      post recipes_path, params: {
        recipe: {
          bean_id: bean.id,
          basket_id: basket.id,
          style: "Espresso"
        },
        initial_dose: 18.0,
        initial_grind: 4.2
      }
    end
    assert_redirected_to root_path
    recipe = Recipe.last
    assert_equal "Espresso", recipe.style

    # 2. Quick Log Brew for Recipe (supports values exceeding 99.9)
    assert_difference "Brew.count", 1 do
      post quick_log_recipe_path(recipe), params: {
        dose: 125.5,
        grind: 105.0,
        brew_notes: "Sweet honey notes"
      }
    end
    assert_redirected_to recipes_path
    latest_brew = recipe.brews.last
    assert_equal 125.5, latest_brew.dose
    assert_equal 105.0, latest_brew.grind
    assert_equal "Sweet honey notes", latest_brew.notes

    # 3. Toggle Star on Brew
    patch toggle_star_brew_path(latest_brew), params: { star: true }, as: :json
    assert_response :success
    assert latest_brew.reload.star?

    # 4. Sort Recipes
    patch sort_recipes_path, params: { recipe_ids: [recipe.id] }
    assert_response :success
    assert_equal 1, recipe.reload.position

    # 5. Delete Recipe
    assert_difference "Recipe.count", -1 do
      delete recipe_path(recipe)
    end
    assert_redirected_to root_path
    assert_nil Recipe.find_by(id: recipe.id)
  end

  test "sandbox reset and purge actions function properly" do
    # 1. Reset Sandbox
    post reset_sandbox_path
    assert_redirected_to root_path
    assert_equal "Sandbox has been reset to seed data.", flash[:notice]
    assert Bean.count >= 4
    assert Basket.count >= 3

    # 2. Purge Data with confirmation
    delete purge_data_path, params: { confirmation: "yes, delete everything" }
    assert_redirected_to root_path
    assert_equal "Sandbox data cleared.", flash[:notice]
    assert_equal 0, Bean.count
    assert_equal 0, Basket.count
    assert_equal 0, Recipe.count
    assert_equal 0, Brew.count
  end

  test "jump settings can be configured and are reflected in recipe dial controls" do
    # 1. Update jump settings via HTML form submit
    patch settings_path, params: {
      dose_step_1: "0.25",
      dose_step_2: "0.75",
      grind_step_1: "0.05",
      grind_step_2: "0.15"
    }
    assert_redirected_to settings_path
    follow_redirect!
    assert_response :success
    assert_select "input[name='dose_step_1'][value='0.25']"
    assert_select "input[name='dose_step_2'][value='0.75']"
    assert_select "input[name='grind_step_1'][value='0.05']"
    assert_select "input[name='grind_step_2'][value='0.15']"

    assert_equal "0.25", Setting.get("dose_step_1")
    assert_equal "0.75", Setting.get("dose_step_2")
    assert_equal "0.05", Setting.get("grind_step_1")
    assert_equal "0.15", Setting.get("grind_step_2")

    # 2. Recipe show page displays updated jump buttons
    recipe = recipes(:one)
    get recipe_path(recipe)
    assert_response :success
    assert_select "button[data-amount='-0.75']", text: "-0.75g"
    assert_select "button[data-amount='-0.25']", text: "-0.25g"
    assert_select "button[data-amount='0.25']", text: "+0.25g"
    assert_select "button[data-amount='0.75']", text: "+0.75g"
    assert_select "button[data-amount='-0.15']", text: "-0.15"
    assert_select "button[data-amount='-0.05']", text: "-0.05"
    assert_select "button[data-amount='0.05']", text: "+0.05"
    assert_select "button[data-amount='0.15']", text: "+0.15"

    # 3. Quick log handles 2-decimal dose and grind
    assert_difference "Brew.count", 1 do
      post quick_log_recipe_path(recipe), params: {
        dose: 18.25,
        grind: 4.05,
        brew_notes: "Fine step test"
      }
    end
    assert_redirected_to recipes_path
    new_brew = recipe.brews.last
    assert_equal 18.25, new_brew.dose
    assert_equal 4.05, new_brew.grind

    # 4. Fallback calculation if step 2 is omitted
    patch settings_path, params: {
      dose_step_1: "0.4",
      dose_step_2: "",
      grind_step_1: "0.2",
      grind_step_2: ""
    }
    assert_redirected_to settings_path
    assert_equal "0.4", Setting.get("dose_step_1")
    assert_equal "0.8", Setting.get("dose_step_2")
    assert_equal "0.2", Setting.get("grind_step_1")
    assert_equal "0.4", Setting.get("grind_step_2")

    # 5. Grinder range setting configuration and reflection in new recipe slider
    patch settings_path, params: {
      grinder_min: "2.0",
      grinder_max: "8.5"
    }
    assert_redirected_to settings_path
    assert_equal "2.0", Setting.get("grinder_min")
    assert_equal "8.5", Setting.get("grinder_max")

    get new_recipe_path
    assert_response :success
    assert_select "input#initial_grind_slider[min='2.0'][max='8.5'][value='5.3']"
    assert_select "input#initial_grind_number[min='2.0'][max='8.5'][value='5.3']"
  end
end

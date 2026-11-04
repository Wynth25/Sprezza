Rails.application.routes.draw do
  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  delete 'logout', to: 'sessions#destroy'
  
  get 'settings', to: 'settings#show'
  patch 'settings', to: 'settings#update'
  delete 'purge_data', to: 'data#purge'

  resources :beans do
    collection do
      get :archived
      patch :sort
    end

    member do
      patch :archive
      patch :update_freeze
    end
  end

  resources :baskets do
    collection do
      patch :sort
    end
  end
  
  resources :recipes do
    collection do
      patch :sort
    end

    member do
      post :quick_log
    end

    resources :brews
  end

  patch "brews/:id/toggle_star", to: "brews#toggle_star", as: :toggle_star_brew
  
  root "recipes#index"
end

#[macro_use] extern crate rocket;

use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;
use rocket::form::Form;
use rocket::fs::TempFile;
use rocket::http::Status;
use rocket::serde::{json::Json, Serialize, Deserialize};
use rocket::tokio::io::AsyncReadExt;
use rocket_cors::{AllowedOrigins, CorsOptions};
use uuid::Uuid;

#[derive(Deserialize, Serialize, Clone)]
pub struct ParticipantsData {
    vec: Vec<String>,
}

#[derive(FromForm)]
pub struct Upload<'a> {
    #[field(validate = len(..=2_196_608))]
    file: Option<TempFile<'a>>,
    text: Option<String>,
}


lazy_static! {
    static ref ROULETTES: Mutex<HashMap<String, ParticipantsData>> = Mutex::new(HashMap::new());
}


#[post("/roulette", data = "<upload>")]
pub async fn create_roulette(upload: Form<Upload<'_>>) -> Result<Json<String>, Status> {
    let upload = match (&upload.file, &upload.text) {
        (Some(file), _) => {
            let content_type = file.content_type();
            if content_type.is_none() || !content_type.unwrap().is_text() {
                eprintln!("Received non-text file: {:?}", content_type);
                return Err(Status::BadRequest);
            }

            let mut content = String::new();

            let mut opened_file = file.open().await
                .map_err(|e| {
                    eprintln!("Error opening file: {:?}", e);
                    Status::InternalServerError
                })?;
            opened_file.read_to_string(&mut content).await
                .map_err(|e| {
                    eprintln!("Error reading file as string: {:?}", e);
                    Status::InternalServerError
                })?;
            
            content
        }
        (None, Some(text)) => String::from(text).replace("\\n", "\n"),
        _ => return Err(Status::BadRequest),
    };
    
    let participants: Vec<String> = upload.split("\n")
        .map(|s| s.trim().to_string())
        .filter(|x| !x.is_empty())
        .collect();
    
    if participants.is_empty() {
        return Err(Status::BadRequest);
    }
    
    let uuid = Uuid::new_v4().to_string();
    let mut roulettes = ROULETTES.lock()
        .map_err(|_| Status::InternalServerError)?;
    roulettes.insert(uuid.clone(), ParticipantsData { vec: participants });
    
    Ok(Json(uuid))
}

#[get("/roulette?<uuid>")]
fn get_participants(uuid: String) -> Result<Json<ParticipantsData>, Status> {
    let roulettes = ROULETTES.lock()
        .map_err(|_| Status::InternalServerError)?;
    roulettes.get(&uuid)
        .cloned()
        .map(Json)
        .ok_or(Status::NotFound)
}


#[launch]
fn rocket() -> _ {
    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::all())
        .to_cors()
        .expect("CORS config error");
    
    rocket::build()
        .mount("/", routes![get_participants, create_roulette])
        .attach(cors)
}